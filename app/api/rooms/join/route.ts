import { NextResponse } from 'next/server'
import { z } from 'zod'
import { RoomService } from '@/lib/game/room-service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/api-guard'

export const runtime = 'nodejs'

const requestSchema = z.object({
  roomId: z.string().min(1),
  displayName: z.string().min(1).max(30),
  sessionId: z.string().min(1),
})

export async function POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'rooms-join', 10, 60000)
  if (rateLimited) return rateLimited

  const body = await request.json()
  console.log('Join request body:', body)

  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    console.error('Join request validation failed:', parsed.error)
    return NextResponse.json({ error: 'Invalid join request' }, { status: 400 })
  }

  try {
    const supabase = createServerSupabaseClient()
    const roomService = new RoomService(supabase)
    const player = await roomService.joinRoom(parsed.data.roomId, parsed.data.displayName, parsed.data.sessionId)

    return NextResponse.json({ player }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to join room'

    return NextResponse.json({ error: message }, { status: 409 })
  }
}
