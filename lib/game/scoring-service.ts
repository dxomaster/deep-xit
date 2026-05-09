import type { ScoreDelta, ScoreInput, UUID } from './types'

export class ScoringService {
  calculate(input: ScoreInput): ScoreDelta[] {
    const storytellerCard = input.cards.find((card) => card.isStorytellerCard)

    if (!storytellerCard) {
      throw new Error('Cannot score round without a storyteller card')
    }

    if (storytellerCard.playerId !== input.storytellerId) {
      throw new Error('Storyteller card must belong to the storyteller')
    }

    const eligibleGuessers = input.players.filter((player) => player.id !== input.storytellerId)
    const votesByPlayer = new Map(input.votes.map((vote) => [vote.voterId, vote]))

    for (const guesser of eligibleGuessers) {
      if (!votesByPlayer.has(guesser.id)) {
        throw new Error(`Player ${guesser.id} has not voted`)
      }
    }

    const correctVotes = input.votes.filter((vote) => vote.cardId === storytellerCard.id)
    const allGuessersFoundCard = correctVotes.length === eligibleGuessers.length
    const noGuessersFoundCard = correctVotes.length === 0
    const scoreByPlayerId = new Map<UUID, ScoreDelta>()

    for (const player of input.players) {
      scoreByPlayerId.set(player.id, {
        playerId: player.id,
        points: 0,
        reasons: [],
      })
    }

    if (allGuessersFoundCard || noGuessersFoundCard) {
      for (const guesser of eligibleGuessers) {
        this.addPoints(scoreByPlayerId, guesser.id, 2, 'FAILED_STORYTELLER_ROUND')
      }
    } else {
      this.addPoints(scoreByPlayerId, input.storytellerId, 3, 'STORYTELLER_SUCCESS')

      for (const vote of correctVotes) {
        this.addPoints(scoreByPlayerId, vote.voterId, 3, 'CORRECT_GUESS')
      }
    }

    for (const vote of input.votes) {
      const votedCard = input.cards.find((card) => card.id === vote.cardId)

      if (votedCard && !votedCard.isStorytellerCard && votedCard.playerId !== vote.voterId) {
        this.addPoints(scoreByPlayerId, votedCard.playerId, 1, 'BLUFF_BONUS')
      }
    }

    return Array.from(scoreByPlayerId.values())
  }

  private addPoints(scoreByPlayerId: Map<UUID, ScoreDelta>, playerId: UUID, points: number, reason: ScoreDelta['reasons'][number]) {
    const score = scoreByPlayerId.get(playerId)

    if (!score) {
      throw new Error(`Cannot assign score to unknown player ${playerId}`)
    }

    score.points += points
    score.reasons.push(reason)
  }
}

export const scoringService = new ScoringService()
