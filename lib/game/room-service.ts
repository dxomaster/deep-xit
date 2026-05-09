import type { SupabaseClient } from '@supabase/supabase-js'
import { mapCard, mapPlayer, mapRoom } from './mappers'
import { TogetherImageService } from '@/lib/image-generation/together-image-service'
import type { Card, Player, Room, UUID } from './types'

const PLACEHOLDER_IMAGES = [
  'https://picsum.photos/seed/dx1/512/512',
  'https://picsum.photos/seed/dx2/512/512',
  'https://picsum.photos/seed/dx3/512/512',
  'https://picsum.photos/seed/dx4/512/512',
  'https://picsum.photos/seed/dx5/512/512',
  'https://picsum.photos/seed/dx6/512/512',
  'https://picsum.photos/seed/dx7/512/512',
  'https://picsum.photos/seed/dx8/512/512',
  'https://picsum.photos/seed/dx9/512/512',
  'https://picsum.photos/seed/dx10/512/512',
  'https://picsum.photos/seed/dx11/512/512',
  'https://picsum.photos/seed/dx12/512/512',
  'https://picsum.photos/seed/dx13/512/512',
  'https://picsum.photos/seed/dx14/512/512',
  'https://picsum.photos/seed/dx15/512/512',
  'https://picsum.photos/seed/dx16/512/512',
  'https://picsum.photos/seed/dx17/512/512',
  'https://picsum.photos/seed/dx18/512/512',
  'https://picsum.photos/seed/dx19/512/512',
  'https://picsum.photos/seed/dx20/512/512',
  'https://picsum.photos/seed/dx21/512/512',
  'https://picsum.photos/seed/dx22/512/512',
  'https://picsum.photos/seed/dx23/512/512',
  'https://picsum.photos/seed/dx24/512/512',
  'https://picsum.photos/seed/dx25/512/512',
  'https://picsum.photos/seed/dx26/512/512',
  'https://picsum.photos/seed/dx27/512/512',
  'https://picsum.photos/seed/dx28/512/512',
  'https://picsum.photos/seed/dx29/512/512',
  'https://picsum.photos/seed/dx30/512/512',
]

const CARDS_PER_HAND = 6
const MIN_PLAYERS = 3

export class RoomService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly imageService: TogetherImageService = new TogetherImageService(supabase),
  ) {}

  async createRoom(theme?: string, useAI: boolean = true, maxRounds: number = 10): Promise<Room> {
    const insertData: any = { status: 'LOBBY', max_rounds: maxRounds }
    if (theme) {
      insertData.theme = JSON.stringify({ text: theme, useAI })
    } else {
      insertData.theme = JSON.stringify({ useAI })
    }

    const { data, error } = await this.supabase
      .from('rooms')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create room: ${error.message}`)
    }

    return mapRoom(data)
  }

  async joinRoom(roomId: UUID, displayName: string, sessionId: string): Promise<Player> {
    const { data: room, error: roomError } = await this.supabase
      .from('rooms')
      .select('id, status')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      throw new Error('Room not found')
    }

    if (room.status !== 'LOBBY') {
      throw new Error('Cannot join a game that has already started')
    }

    const { data: existingPlayer } = await this.supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .eq('session_id', sessionId)
      .maybeSingle()

    if (existingPlayer) {
      return mapPlayer(existingPlayer)
    }

    const { data, error } = await this.supabase
      .from('players')
      .insert({
        room_id: roomId,
        display_name: displayName.trim(),
        session_id: sessionId,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to join room: ${error.message}`)
    }

    return mapPlayer(data)
  }

  async startGame(roomId: UUID): Promise<{ storyteller: Player; cards: Card[] }> {
    const { data: room, error: roomError } = await this.supabase
      .from('rooms')
      .select('id, status, theme')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      throw new Error('Room not found')
    }

    if (room.status !== 'LOBBY') {
      throw new Error('Game has already started')
    }

    // Clear existing cards when starting a new game
    await this.supabase.from('cards').delete().eq('room_id', roomId)
    await this.supabase.from('votes').delete().eq('room_id', roomId)

    const { data: players, error: playersError } = await this.supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (playersError || !players) {
      throw new Error('Failed to load players')
    }

    if (players.length < MIN_PLAYERS) {
      throw new Error(`Need at least ${MIN_PLAYERS} players to start (currently ${players.length})`)
    }

    const storytellerIndex = Math.floor(Math.random() * players.length)
    const storyteller = players[storytellerIndex]

    const totalCards = players.length * CARDS_PER_HAND
    let theme = 'fantasy dreams'
    let useAI = true

    try {
      const themeData = JSON.parse(room.theme ?? '{}')
      theme = themeData.text || 'fantasy dreams'
      useAI = themeData.useAI !== false
    } catch {
      theme = room.theme || 'fantasy dreams'
    }

    console.log('Generating cards:', { totalCards, theme, useAI, playersCount: players.length })
    let images: { url: string }[] = []

    // Set is_generating_images to true when starting generation
    await this.supabase.from('rooms').update({ is_generating_images: true }).eq('id', roomId)

    if (useAI) {
      try {
        // Batch image generation in chunks of 4 to respect rate limit (4 QPS)
        for (let offset = 0; offset < totalCards; offset += 4) {
          const batchSize = Math.min(4, totalCards - offset)
          console.log('Generating batch:', { offset, batchSize })
          const batchImages = await this.imageService.generateDixitImages({ theme, count: batchSize })
          console.log('Batch images generated:', batchImages.length)
          images.push(...batchImages)

          // Add 500ms delay between batches to respect rate limit
          if (offset + batchSize < totalCards) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }

        console.log('Total images generated:', images.length)
        console.log('Sample image URL:', images[0]?.url)
      } catch (error) {
        console.error('AI image generation failed:', error)
        // Set is_generating_images to false on error
        await this.supabase.from('rooms').update({ is_generating_images: false }).eq('id', roomId)
        throw new Error(`Failed to generate AI images: ${error instanceof Error ? error.message : String(error)}`)
      }
    } else {
      // Use placeholder images
      images = Array.from({ length: totalCards }, (_, i) => ({
        url: PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length]
      }))
      console.log('Using placeholder images (user choice)')
    }

    const cardInserts = []
    let imageIdx = 0

    for (const player of players) {
      for (let c = 0; c < CARDS_PER_HAND; c++) {
        if (imageIdx >= images.length) break
        cardInserts.push({
          room_id: roomId,
          player_id: player.id,
          image_url: images[imageIdx].url,
        })
        imageIdx++
      }
    }

    console.log('Card inserts:', cardInserts.length)

    const { data: cards, error: cardsError } = await this.supabase
      .from('cards')
      .insert(cardInserts)
      .select()

    if (cardsError) {
      throw new Error(`Failed to generate cards: ${cardsError.message}`)
    }

    console.log('Cards inserted to DB:', cards?.length)

    const { error: updateError } = await this.supabase
      .from('rooms')
      .update({ storyteller_id: storyteller.id, status: 'STORYTELLING', is_generating_images: false })
      .eq('id', roomId)

    if (updateError) {
      throw new Error(`Failed to start game: ${updateError.message}`)
    }

    return {
      storyteller: mapPlayer(storyteller),
      cards: (cards ?? []).map(mapCard),
    }
  }

  async nextRound(roomId: UUID): Promise<{ storyteller: Player | null; isGameOver: boolean; winner: Player | null }> {
    const { data: room, error: roomError } = await this.supabase
      .from('rooms')
      .select('id, status, storyteller_id, theme, current_round')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      throw new Error('Room not found')
    }

    if (room.status !== 'SCORING') {
      throw new Error('Can only start next round after scoring')
    }

    const nextRoundNumber = (room.current_round || 1) + 1

    await this.supabase.from('votes').delete().eq('room_id', roomId)

    // Delete cards that were submitted for the round (they should be discarded)
    // First, fetch the cards to get their image URLs for cleanup
    const { data: cardsToDelete } = await this.supabase
      .from('cards')
      .select('image_url')
      .eq('room_id', roomId)
      .eq('is_submitted_for_round', true)

    // Delete images from Supabase Storage
    if (cardsToDelete) {
      for (const card of cardsToDelete) {
        if (card.image_url) {
          // Extract file name from URL
          const fileName = card.image_url.split('/').pop()
          if (fileName) {
            await this.supabase.storage
              .from('card-images')
              .remove([fileName])
          }
        }
      }
    }

    // Delete card records from database
    await this.supabase
      .from('cards')
      .delete()
      .eq('room_id', roomId)
      .eq('is_submitted_for_round', true)

    // Reset flags for remaining cards
    await this.supabase
      .from('cards')
      .update({ is_submitted_for_round: false, is_storyteller_card: false })
      .eq('room_id', roomId)

    const { data: players, error: playersError } = await this.supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (playersError || !players || players.length < MIN_PLAYERS) {
      throw new Error('Not enough players for next round')
    }

    const currentStorytellerIdx = players.findIndex((p) => p.id === room.storyteller_id)
    const nextStorytellerIdx = (currentStorytellerIdx + 1) % players.length
    const nextStoryteller = players[nextStorytellerIdx]

    // Get existing cards for each player
    const { data: existingCards, error: cardsError } = await this.supabase
      .from('cards')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (cardsError) {
      throw new Error('Failed to load existing cards')
    }

    // Group cards by player
    const cardsByPlayer = new Map<UUID, typeof existingCards>()
    for (const card of existingCards ?? []) {
      const playerCards = cardsByPlayer.get(card.player_id) || []
      playerCards.push(card)
      cardsByPlayer.set(card.player_id, playerCards)
    }

    // Calculate how many new cards each player needs
    let totalCardsToGenerate = 0
    const cardsNeededByPlayer = new Map<UUID, number>()

    for (const player of players) {
      const playerCards = cardsByPlayer.get(player.id) || []
      const cardsNeeded = CARDS_PER_HAND - playerCards.length
      if (cardsNeeded > 0) {
        totalCardsToGenerate += cardsNeeded
        cardsNeededByPlayer.set(player.id, cardsNeeded)
      }
    }

    let theme = 'fantasy dreams'
    let useAI = true

    try {
      const themeData = JSON.parse(room.theme ?? '{}')
      theme = themeData.text || 'fantasy dreams'
      useAI = themeData.useAI !== false
    } catch {
      theme = room.theme || 'fantasy dreams'
    }

    console.log('Generating cards for next round:', { totalCardsToGenerate, theme, useAI, playersCount: players.length })
    let images: { url: string }[] = []

    // Set is_generating_images to true when starting generation
    if (totalCardsToGenerate > 0) {
      await this.supabase.from('rooms').update({ is_generating_images: true }).eq('id', roomId)
    }

    if (totalCardsToGenerate > 0 && useAI) {
      try {
        // Batch image generation in chunks of 4 to respect rate limit (4 QPS)
        for (let offset = 0; offset < totalCardsToGenerate; offset += 4) {
          const batchSize = Math.min(4, totalCardsToGenerate - offset)
          console.log('Generating batch:', { offset, batchSize })
          const batchImages = await this.imageService.generateDixitImages({ theme, count: batchSize })
          console.log('Batch images generated:', batchImages.length)
          images.push(...batchImages)

          // Add 500ms delay between batches to respect rate limit
          if (offset + batchSize < totalCardsToGenerate) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }

        console.log('Total images generated:', images.length)
        console.log('Sample image URL:', images[0]?.url)
      } catch (error) {
        console.error('AI image generation failed:', error)
        // Set is_generating_images to false on error
        await this.supabase.from('rooms').update({ is_generating_images: false }).eq('id', roomId)
        throw new Error(`Failed to generate AI images: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Insert new cards for players who need them
    let imageIdx = 0
    const cardInserts = []

    for (const player of players) {
      const cardsNeeded = cardsNeededByPlayer.get(player.id) || 0
      for (let c = 0; c < cardsNeeded; c++) {
        if (imageIdx >= images.length) break
        cardInserts.push({
          room_id: roomId,
          player_id: player.id,
          image_url: images[imageIdx].url,
        })
        imageIdx++
      }
    }

    if (cardInserts.length > 0) {
      await this.supabase.from('cards').insert(cardInserts)
    }

    const { error: updateError } = await this.supabase
      .from('rooms')
      .update({
        storyteller_id: nextStoryteller.id,
        status: 'STORYTELLING',
        clue: null,
        current_round: nextRoundNumber,
        is_generating_images: false,
      })
      .eq('id', roomId)

    if (updateError) {
      throw new Error(`Failed to advance round: ${updateError.message}`)
    }

    return { storyteller: mapPlayer(nextStoryteller), isGameOver: false, winner: null }
  }
}
