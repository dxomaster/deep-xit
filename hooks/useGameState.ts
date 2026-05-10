"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { mapCard, mapPlayer, mapRoom, mapVote } from '@/lib/game/mappers'
import type { Card, Player, RoomStatus, UUID, Vote } from '@/lib/game/types'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type RoomRow = Database['public']['Tables']['rooms']['Row']
type PlayerRow = Database['public']['Tables']['players']['Row']
type CardRow = Database['public']['Tables']['cards']['Row']
type VoteRow = Database['public']['Tables']['votes']['Row']

export interface GameState {
  status: RoomStatus | null
  storytellerId: UUID | null
  currentClue: string | null
  players: Player[]
  cards: Card[]
  votes: Vote[]
  currentRound: number
  maxRounds: number
  isGeneratingImages: boolean
}

export interface UseGameStateResult {
  gameState: GameState
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const emptyGameState: GameState = {
  status: null,
  storytellerId: null,
  currentClue: null,
  players: [],
  cards: [],
  votes: [],
  currentRound: 1,
  maxRounds: 10,
  isGeneratingImages: false,
}

export function useGameState(roomId: UUID | null | undefined, currentPlayerId?: string | null): UseGameStateResult {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [gameState, setGameState] = useState<GameState>(emptyGameState)
  const [isLoading, setIsLoading] = useState(Boolean(roomId))
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)

  const refresh = useMemo(() => createRefreshGameState(supabase, roomId, currentPlayerId ?? null, setGameState, (loading) => {
    // Only show the loading screen on the very first load — not on background refreshes
    if (!hasLoadedRef.current) {
      setIsLoading(loading)
      if (!loading) hasLoadedRef.current = true
    }
  }, setError), [roomId, currentPlayerId, supabase])

  useEffect(() => {
    if (!roomId) {
      setGameState(emptyGameState)
      setIsLoading(false)
      setError(null)
      return
    }

    void refresh()

    const roomChannel = supabase
      .channel(`game-state:${roomId}:rooms`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setGameState(emptyGameState)
            return
          }

          const room = mapRoom(payload.new as RoomRow)

          setGameState((current) => {
            const statusChanged = current.status !== room.status
            if (statusChanged) {
              void refresh()
            }
            return {
              ...current,
              status: room.status,
              storytellerId: room.storytellerId,
              currentClue: room.clue,
              isGeneratingImages: room.isGeneratingImages,
            }
          })
        },
      )
      .subscribe()

    const cardsChannel = supabase
      .channel(`game-state:${roomId}:cards`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setGameState((current) => ({
            ...current,
            cards: reduceCardsRealtimeEvent(current.cards, payload.eventType, payload.new as CardRow, payload.old as Partial<CardRow>),
          }))
        },
      )
      .subscribe()

    const playersChannel = supabase
      .channel(`game-state:${roomId}:players`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setGameState((current) => ({
            ...current,
            players: reducePlayersRealtimeEvent(current.players, payload.eventType, payload.new as PlayerRow, payload.old as Partial<PlayerRow>),
          }))
        },
      )
      .subscribe()

    const votesChannel = supabase
      .channel(`game-state:${roomId}:votes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setGameState((current) => ({
            ...current,
            votes: reduceVotesRealtimeEvent(current.votes, payload.eventType, payload.new as VoteRow, payload.old as Partial<VoteRow>),
          }))
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(roomChannel)
      void supabase.removeChannel(cardsChannel)
      void supabase.removeChannel(playersChannel)
      void supabase.removeChannel(votesChannel)
    }
  }, [refresh, roomId, supabase])

  return {
    gameState,
    isLoading,
    error,
    refresh,
  }
}

function filterGameStateByPhase(
  status: RoomStatus | null,
  cards: Card[],
  votes: Vote[],
  currentPlayerId: string | null,
  storytellerId: UUID | null,
): { cards: Card[]; votes: Vote[] } {
  if (!status || !currentPlayerId) return { cards, votes }

  if (status === 'VOTING') {
    // During VOTING: strip playerId from submitted cards so clients can't identify the storyteller's card
    // Keep playerId for the current player's own cards (they need to see their hand)
    const filteredCards = cards.map((card) => {
      if (card.isSubmittedForRound && card.playerId !== currentPlayerId) {
        return { ...card, playerId: '__hidden__' as UUID }
      }
      return card
    })
    // Hide all votes until scoring
    return { cards: filteredCards, votes: [] }
  }

  if (status === 'BLUFFING') {
    // During BLUFFING: hide which submitted card is the storyteller's
    const filteredCards = cards.map((card) => {
      if (card.isSubmittedForRound && card.playerId !== currentPlayerId) {
        return { ...card, playerId: '__hidden__' as UUID }
      }
      return card
    })
    return { cards: filteredCards, votes: [] }
  }

  if (status === 'STORYTELLING') {
    // During STORYTELLING: no votes should be visible
    return { cards, votes: [] }
  }

  // SCORING / FINISHED: return everything
  return { cards, votes }
}

function createRefreshGameState(
  supabase: SupabaseClient<Database>,
  roomId: UUID | null | undefined,
  currentPlayerId: string | null,
  setGameState: (gameState: GameState) => void,
  setIsLoading: (isLoading: boolean) => void,
  setError: (error: string | null) => void,
): () => Promise<void> {
  return async () => {
    if (!roomId) {
      return
    }

    setIsLoading(true)
    setError(null)

    const [{ data: room, error: roomError }, { data: players, error: playersError }, { data: cards, error: cardsError }, { data: votes, error: votesError }] = await Promise.all([
      supabase.from('rooms').select('*').eq('id', roomId).single(),
      supabase.from('players').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
      supabase.from('cards').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
      supabase.from('votes').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
    ])

    if (roomError) {
      setError(`Failed to load room: ${roomError.message}`)
      setIsLoading(false)
      return
    }

    if (playersError) {
      setError(`Failed to load players: ${playersError.message}`)
      setIsLoading(false)
      return
    }

    if (cardsError) {
      setError(`Failed to load cards: ${cardsError.message}`)
      setIsLoading(false)
      return
    }

    if (votesError) {
      setError(`Failed to load votes: ${votesError.message}`)
      setIsLoading(false)
      return
    }

    const mappedRoom = mapRoom(room)
    const allCards = (cards ?? []).map(mapCard)
    const allVotes = (votes ?? []).map(mapVote)
    const { cards: filteredCards, votes: filteredVotes } = filterGameStateByPhase(
      mappedRoom.status,
      allCards,
      allVotes,
      currentPlayerId,
      mappedRoom.storytellerId,
    )

    setGameState({
      status: mappedRoom.status,
      storytellerId: mappedRoom.storytellerId,
      currentClue: mappedRoom.clue,
      players: (players ?? []).map(mapPlayer),
      cards: filteredCards,
      votes: filteredVotes,
      currentRound: mappedRoom.currentRound,
      maxRounds: mappedRoom.maxRounds,
      isGeneratingImages: mappedRoom.isGeneratingImages,
    })
    setIsLoading(false)
  }
}

function reduceCardsRealtimeEvent(cards: Card[], eventType: string, newRow: CardRow, oldRow: Partial<CardRow>): Card[] {
  if (eventType === 'DELETE') {
    return cards.filter((card) => card.id !== oldRow.id)
  }

  const nextCard = mapCard(newRow)
  const existingIndex = cards.findIndex((card) => card.id === nextCard.id)

  if (existingIndex === -1) {
    return [...cards, nextCard].sort(sortByCreatedAt)
  }

  return cards.map((card) => (card.id === nextCard.id ? nextCard : card)).sort(sortByCreatedAt)
}

function reducePlayersRealtimeEvent(players: Player[], eventType: string, newRow: PlayerRow, oldRow: Partial<PlayerRow>): Player[] {
  if (eventType === 'DELETE') {
    return players.filter((player) => player.id !== oldRow.id)
  }

  const nextPlayer = mapPlayer(newRow)
  const existingIndex = players.findIndex((player) => player.id === nextPlayer.id)

  if (existingIndex === -1) {
    return [...players, nextPlayer].sort(sortByCreatedAt)
  }

  return players.map((player) => (player.id === nextPlayer.id ? nextPlayer : player)).sort(sortByCreatedAt)
}

function reduceVotesRealtimeEvent(votes: Vote[], eventType: string, newRow: VoteRow, oldRow: Partial<VoteRow>): Vote[] {
  if (eventType === 'DELETE') {
    return votes.filter((vote) => vote.id !== oldRow.id)
  }

  const nextVote = mapVote(newRow)
  const existingIndex = votes.findIndex((vote) => vote.id === nextVote.id)

  if (existingIndex === -1) {
    return [...votes, nextVote].sort(sortByCreatedAt)
  }

  return votes.map((vote) => (vote.id === nextVote.id ? nextVote : vote)).sort(sortByCreatedAt)
}

function sortByCreatedAt<T extends { createdAt: string }>(left: T, right: T): number {
  return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
}
