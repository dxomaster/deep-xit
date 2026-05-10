export const ROOM_STATUSES = ['LOBBY', 'STORYTELLING', 'BLUFFING', 'VOTING', 'SCORING', 'FINISHED'] as const

export type RoomStatus = (typeof ROOM_STATUSES)[number]

export type UUID = string

export interface Room {
  id: UUID
  status: RoomStatus
  storytellerId: UUID | null
  clue: string | null
  theme: string | null
  maxRounds: number
  currentRound: number
  isGeneratingImages: boolean
  createdAt: string
  updatedAt: string
}

export interface Player {
  id: UUID
  roomId: UUID
  displayName: string
  score: number
  sessionId: string
  createdAt: string
}

export interface Card {
  id: UUID
  roomId: UUID
  playerId: UUID
  imageUrl: string
  isStorytellerCard: boolean
  isSubmittedForRound: boolean
  createdAt: string
}

export interface Vote {
  id: UUID
  roomId: UUID
  voterId: UUID
  cardId: UUID
  createdAt: string
}

export interface ScoreDelta {
  playerId: UUID
  points: number
  reasons: ScoreReason[]
}

export type ScoreReason = 'STORYTELLER_SUCCESS' | 'CORRECT_GUESS' | 'FAILED_STORYTELLER_ROUND' | 'BLUFF_BONUS'

export interface ScoreInput {
  players: Player[]
  cards: Card[]
  votes: Vote[]
  storytellerId: UUID
}

export interface SubmitVoteCommand {
  roomId: UUID
  voterId: UUID
  cardId: UUID
}

export interface GenerateImagesCommand {
  theme: string
  count?: number
}

export interface GeneratedImage {
  url: string
  prompt: string
  error?: string // Optional error field for failed generations
}
