import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { applyRateLimit, validateSession } from '@/lib/api-guard'

export const runtime = 'nodejs'

const requestSchema = z.object({
  roomId: z.string().uuid(),
  sessionId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'scoring-end-game', 5, 60000)
  if (rateLimited) return rateLimited

  const parsed = requestSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  try {
    const supabase = createServerSupabaseClient()

    const sessionResult = await validateSession(supabase, parsed.data.roomId, parsed.data.sessionId)
    if (sessionResult instanceof NextResponse) return sessionResult

    const roomId = parsed.data.roomId

    // Get room data
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, status, current_round, max_rounds')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.status !== 'SCORING') {
      return NextResponse.json({ error: 'Room is not in SCORING status' }, { status: 400 })
    }

    // Check if game should end
    const currentRound = room.current_round || 1
    const maxRounds = room.max_rounds || 10

    if (currentRound < maxRounds) {
      return NextResponse.json({ error: 'Game has not reached max rounds yet' }, { status: 400 })
    }

    // End the game - set status to FINISHED
    const { error: finishError } = await supabase
      .from('rooms')
      .update({ status: 'FINISHED' })
      .eq('id', roomId)

    if (finishError) {
      return NextResponse.json({ error: `Failed to end game: ${finishError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error ending game:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
