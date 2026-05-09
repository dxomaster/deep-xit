import type { SupabaseClient } from '@supabase/supabase-js'
import { TogetherImageService, togetherImageService } from '@/lib/image-generation/together-image-service'
import { mapCard } from './mappers'
import type { Card, UUID } from './types'

export interface GenerateHandCommand {
  roomId: UUID
  playerId: UUID
  theme: string
  count?: number
}

export class GenerateHandService {
  private readonly imageService: TogetherImageService

  constructor(
    private readonly supabase: SupabaseClient,
    imageService?: TogetherImageService,
  ) {
    this.imageService = imageService ?? new TogetherImageService(supabase)
  }

  async generateHand(command: GenerateHandCommand): Promise<Card[]> {
    const count = command.count ?? 6

    const { data: player, error: playerError } = await this.supabase
      .from('players')
      .select('id, room_id')
      .eq('id', command.playerId)
      .eq('room_id', command.roomId)
      .single()

    if (playerError || !player) {
      throw new Error('Player does not belong to this room')
    }

    const { count: existingCardCount, error: countError } = await this.supabase
      .from('cards')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', command.roomId)
      .eq('player_id', command.playerId)

    if (countError) {
      throw new Error(`Failed to count existing cards: ${countError.message}`)
    }

    if ((existingCardCount ?? 0) > 0) {
      throw new Error('Player already has generated cards in this room')
    }

    const images = await this.imageService.generateDixitImages({
      theme: command.theme,
      count,
    })

    const { data, error } = await this.supabase
      .from('cards')
      .insert(
        images.map((image) => ({
          room_id: command.roomId,
          player_id: command.playerId,
          image_url: image.url,
          is_storyteller_card: false,
        })),
      )
      .select()

    if (error) {
      throw new Error(`Failed to persist generated hand: ${error.message}`)
    }

    return (data ?? []).map(mapCard)
  }
}
