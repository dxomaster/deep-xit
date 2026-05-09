import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { mapVote } from './mappers'
import type { SubmitVoteCommand, Vote } from './types'

export class VotingService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async submitVote(command: SubmitVoteCommand): Promise<Vote> {
    const { data: voter, error: voterError } = await this.supabase
      .from('players')
      .select('id, room_id')
      .eq('id', command.voterId)
      .eq('room_id', command.roomId)
      .single()

    if (voterError || !voter) {
      throw new Error('Voter does not belong to this room')
    }

    const { data: room, error: roomError } = await this.supabase
      .from('rooms')
      .select('id, status, storyteller_id')
      .eq('id', command.roomId)
      .eq('status', 'VOTING')
      .single()

    if (roomError || !room) {
      throw new Error('Room is not accepting votes')
    }

    const { data: card, error: cardError } = await this.supabase
      .from('cards')
      .select('id, room_id, player_id, is_submitted_for_round')
      .eq('id', command.cardId)
      .eq('room_id', command.roomId)
      .eq('is_submitted_for_round', true)
      .single()

    if (cardError || !card) {
      throw new Error('Card does not belong to this room')
    }

    if (card.player_id === command.voterId) {
      throw new Error('Players cannot vote for their own card')
    }

    // Explicit check: Storyteller cannot vote
    if (room.storyteller_id === command.voterId) {
      throw new Error('Storyteller cannot vote')
    }

    const { data, error } = await this.supabase
      .from('votes')
      .insert({
        room_id: command.roomId,
        voter_id: command.voterId,
        card_id: command.cardId,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('Vote already submitted for this round')
      }

      throw new Error(`Failed to submit vote: ${error.message}`)
    }

    return mapVote(data)
  }
}
