import type { SupabaseClient } from '@supabase/supabase-js'
import { mapCard, mapPlayer, mapVote } from './mappers'
import { scoringService, ScoringService } from './scoring-service'
import type { ScoreDelta, UUID } from './types'

export class GameEngineService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly scorer: ScoringService = scoringService,
  ) {}

  async areAllVotesIn(roomId: UUID): Promise<boolean> {
    const { data: room, error: roomError } = await this.supabase
      .from('rooms')
      .select('id, storyteller_id, status')
      .eq('id', roomId)
      .single()

    if (roomError || !room?.storyteller_id || room.status !== 'VOTING') {
      return false
    }

    const { count: playerCount } = await this.supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .neq('id', room.storyteller_id)

    const { count: voteCount } = await this.supabase
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', roomId)

    return (voteCount ?? 0) >= (playerCount ?? 1)
  }

  async getScoredDeltas(roomId: UUID): Promise<ScoreDelta[]> {
    const { data: room, error: roomError } = await this.supabase
      .from('rooms')
      .select('id, storyteller_id, status')
      .eq('id', roomId)
      .single()

    if (roomError || !room?.storyteller_id) {
      throw new Error('Cannot get scoring results without a storyteller')
    }

    if (room.status !== 'SCORING') {
      throw new Error('Room must be in SCORING to fetch results')
    }

    const [{ data: playerRows, error: playersError }, { data: cardRows, error: cardsError }, { data: voteRows, error: votesError }] = await Promise.all([
      this.supabase.from('players').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
      this.supabase.from('cards').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
      this.supabase.from('votes').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
    ])

    if (playersError) throw new Error(`Failed to load players: ${playersError.message}`)
    if (cardsError) throw new Error(`Failed to load cards: ${cardsError.message}`)
    if (votesError) throw new Error(`Failed to load votes: ${votesError.message}`)

    return this.scorer.calculate({
      players: (playerRows ?? []).map(mapPlayer),
      cards: (cardRows ?? []).map(mapCard),
      votes: (voteRows ?? []).map(mapVote),
      storytellerId: room.storyteller_id,
    })
  }

  async scoreRoom(roomId: UUID): Promise<ScoreDelta[]> {
    const { data: room, error: roomError } = await this.supabase
      .from('rooms')
      .select('id, storyteller_id, status, current_round, max_rounds')
      .eq('id', roomId)
      .single()

    if (roomError || !room?.storyteller_id) {
      throw new Error('Cannot score room without a storyteller')
    }

    if (room.status !== 'VOTING') {
      throw new Error('Room must be in VOTING to calculate scores')
    }

    const [{ data: playerRows, error: playersError }, { data: cardRows, error: cardsError }, { data: voteRows, error: votesError }] = await Promise.all([
      this.supabase.from('players').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
      this.supabase.from('cards').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
      this.supabase.from('votes').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
    ])

    if (playersError) {
      throw new Error(`Failed to load players: ${playersError.message}`)
    }

    if (cardsError) {
      throw new Error(`Failed to load cards: ${cardsError.message}`)
    }

    if (votesError) {
      throw new Error(`Failed to load votes: ${votesError.message}`)
    }

    const deltas = this.scorer.calculate({
      players: (playerRows ?? []).map(mapPlayer),
      cards: (cardRows ?? []).map(mapCard),
      votes: (voteRows ?? []).map(mapVote),
      storytellerId: room.storyteller_id,
    })

    for (const delta of deltas) {
      if (delta.points === 0) {
        continue
      }

      const { error } = await this.supabase.rpc('increment_player_score', {
        player_id_input: delta.playerId,
        points_input: delta.points,
      })

      if (error) {
        throw new Error(`Failed to update score for player ${delta.playerId}: ${error.message}`)
      }
    }

    // Check if game should end (current round reached max rounds)
    const currentRound = room.current_round || 1
    const maxRounds = room.max_rounds || 10
    const isGameOver = currentRound >= maxRounds

    if (isGameOver) {
      // End the game - set status to FINISHED
      const { error: finishError } = await this.supabase
        .from('rooms')
        .update({ status: 'FINISHED' })
        .eq('id', roomId)

      if (finishError) {
        throw new Error(`Failed to end game: ${finishError.message}`)
      }
    } else {
      const { error: statusError } = await this.supabase.from('rooms').update({ status: 'SCORING' }).eq('id', roomId)

      if (statusError) {
        throw new Error(`Failed to move room to scoring: ${statusError.message}`)
      }
    }

    return deltas
  }
}
