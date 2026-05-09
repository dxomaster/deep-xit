import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { UUID } from './types'

export interface SubmitStorytellerClueCommand {
  roomId: UUID
  storytellerId: UUID
  cardId: UUID
  clue: string
}

export class StorytellingService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async submitClue(command: SubmitStorytellerClueCommand): Promise<void> {
    const { error } = await this.supabase.rpc('submit_storyteller_clue', {
      room_id_input: command.roomId,
      storyteller_id_input: command.storytellerId,
      card_id_input: command.cardId,
      clue_input: command.clue,
    })

    if (error) {
      throw new Error(`Failed to submit storyteller clue: ${error.message}`)
    }
  }
}
