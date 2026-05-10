import { NextResponse } from 'next/server'
import { z } from 'zod'
import { GameEngineService } from '@/lib/game/game-engine-service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { applyRateLimit, validateSession } from '@/lib/api-guard'

export const runtime = 'nodejs'

const requestSchema = z.object({
  roomId: z.string().uuid(),
  sessionId: z.string().min(1),
})

export async function POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'scoring-calculate', 15, 60000)
  if (rateLimited) return rateLimited

  const parsed = requestSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid scoring request' }, { status: 400 })
  }

  try {
    const supabase = createServerSupabaseClient()

    const sessionResult = await validateSession(supabase, parsed.data.roomId, parsed.data.sessionId)
    if (sessionResult instanceof NextResponse) return sessionResult

    const engine = new GameEngineService(supabase)

    const { data: room } = await supabase
      .from('rooms')
      .select('status')
      .eq('id', parsed.data.roomId)
      .single()

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    let deltas
    if (room.status === 'SCORING') {
      // Already scored, just return the results
      deltas = await engine.getScoredDeltas(parsed.data.roomId)
    } else if (room.status === 'VOTING') {
      // Need to check if all votes are in and score
      const allVotesIn = await engine.areAllVotesIn(parsed.data.roomId)

      if (!allVotesIn) {
        return NextResponse.json({ error: 'Not all votes are in yet' }, { status: 409 })
      }

      deltas = await engine.scoreRoom(parsed.data.roomId)
    } else {
      return NextResponse.json({ error: 'Room is not in a scoring phase' }, { status: 409 })
    }

    return NextResponse.json({ deltas })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scoring failed'

    return NextResponse.json({ error: message }, { status: 409 })
  }
}
