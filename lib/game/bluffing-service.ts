import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { UUID } from './types'

export interface SubmitBluffCardCommand {
  roomId: UUID
  playerId: UUID
  cardId: UUID
}

export class BluffingService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async submitBluff(command: SubmitBluffCardCommand): Promise<void> {
    const { error } = await this.supabase.rpc('submit_bluff_card', {
      room_id_input: command.roomId,
      player_id_input: command.playerId,
      card_id_input: command.cardId,
    })

    if (error) {
      throw new Error(`Failed to submit bluff card: ${error.message}`)
    }
  }
}
