import { NextResponse } from 'next/server'
import { z } from 'zod'
import { GameEngineService } from '@/lib/game/game-engine-service'
import { VotingService } from '@/lib/game/voting-service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/api-guard'
import { validateSession } from '@/lib/api-guard'

export const runtime = 'nodejs'

const requestSchema = z.object({
  roomId: z.string().uuid(),
  voterId: z.string().uuid(),
  cardId: z.string().uuid(),
  sessionId: z.string().min(1),
})

export async function POST(request: Request) {
  const rateLimited = applyRateLimit(request, 'voting-submit', 15, 60000)
  if (rateLimited) return rateLimited

  const parsed = requestSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid vote submission' }, { status: 400 })
  }

  try {
    const supabase = createServerSupabaseClient()

    const sessionResult = await validateSession(supabase, parsed.data.roomId, parsed.data.sessionId)
    if (sessionResult instanceof NextResponse) return sessionResult
    if (sessionResult.playerId !== parsed.data.voterId) {
      return NextResponse.json({ error: 'Session does not match voter' }, { status: 403 })
    }

    const votingService = new VotingService(supabase)
    const vote = await votingService.submitVote(parsed.data)

    const engine = new GameEngineService(supabase)
    const allVotesIn = await engine.areAllVotesIn(parsed.data.roomId)
    let deltas = null

    if (allVotesIn) {
      deltas = await engine.scoreRoom(parsed.data.roomId)
    }

    return NextResponse.json({ vote, scored: allVotesIn, deltas }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit vote'

    return NextResponse.json({ error: message }, { status: 409 })
  }
}
