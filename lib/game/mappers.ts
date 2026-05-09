import type { Card, Player, Room, Vote } from './types'

export function mapRoom(row: any): Room {
  return {
    id: row.id,
    status: row.status,
    storytellerId: row.storyteller_id,
    clue: row.clue,
    theme: row.theme ?? null,
    maxRounds: row.max_rounds ?? 10,
    currentRound: row.current_round ?? 1,
    isGeneratingImages: row.is_generating_images ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapPlayer(row: any): Player {
  return {
    id: row.id,
    roomId: row.room_id,
    displayName: row.display_name,
    score: row.score,
    sessionId: row.session_id,
    createdAt: row.created_at,
  }
}

export function mapCard(row: any): Card {
  return {
    id: row.id,
    roomId: row.room_id,
    playerId: row.player_id,
    imageUrl: row.image_url,
    isStorytellerCard: row.is_storyteller_card,
    isSubmittedForRound: row.is_submitted_for_round,
    createdAt: row.created_at,
  }
}

export function mapVote(row: any): Vote {
  return {
    id: row.id,
    roomId: row.room_id,
    voterId: row.voter_id,
    cardId: row.card_id,
    createdAt: row.created_at,
  }
}
