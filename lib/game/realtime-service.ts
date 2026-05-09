import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { mapRoom } from './mappers'
import type { Room, UUID } from './types'

type RoomRow = Database['public']['Tables']['rooms']['Row']

export class RoomRealtimeService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  subscribeToRoomStatus(roomId: UUID, onStatusChange: (room: Room) => void): RealtimeChannel {
    return this.supabase
      .channel(`room:${roomId}:status`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const oldStatus = payload.old.status
          const newRoom = mapRoom(payload.new as RoomRow)

          if (oldStatus !== newRoom.status) {
            onStatusChange(newRoom)
          }
        },
      )
      .subscribe()
  }
}
