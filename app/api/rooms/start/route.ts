import { NextResponse } from 'next/server'
import { z } from 'zod'
import { RoomService } from '@/lib/game/room-service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { applyRateLimit, validateSession } from '@/lib/api-guard'

export const runtime = 'nodejs'

const requestSchema = z.object({
  roomId: z.string().uuid(),
  sessionId: z.string().min(1),
})

export async function POST(request: Request) {
  const rateLimited = applyRateLimit(request, 'rooms-start', 5, 60000)
  if (rateLimited) return rateLimited

  const parsed = requestSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid start request' }, { status: 400 })
  }

  try {
    const supabase = createServerSupabaseClient()

    // Verify session belongs to a player in this room
    const sessionResult = await validateSession(supabase, parsed.data.roomId, parsed.data.sessionId)
    if (sessionResult instanceof NextResponse) return sessionResult

    // Verify the player is the host (first player to join)
    const { data: players } = await supabase
      .from('players')
      .select('id')
      .eq('room_id', parsed.data.roomId)
      .order('created_at', { ascending: true })
      .limit(1)

    if (!players?.[0] || players[0].id !== sessionResult.playerId) {
      return NextResponse.json({ error: 'Only the host can start the game' }, { status: 403 })
    }

    const roomService = new RoomService(supabase)
    const result = await roomService.startGame(parsed.data.roomId)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start game'

    return NextResponse.json({ error: message }, { status: 409 })
  }
}
