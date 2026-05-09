import { NextResponse } from 'next/server'
import { z } from 'zod'
import { BluffingService } from '@/lib/game/bluffing-service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { applyRateLimit, validateSession } from '@/lib/api-guard'

export const runtime = 'nodejs'

const requestSchema = z.object({
  roomId: z.string().uuid(),
  playerId: z.string().uuid(),
  cardId: z.string().uuid(),
  sessionId: z.string().min(1),
})

export async function POST(request: Request) {
  const rateLimited = applyRateLimit(request, 'bluffing-submit', 15, 60000)
  if (rateLimited) return rateLimited

  const parsed = requestSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid bluff submission' }, { status: 400 })
  }

  try {
    const supabase = createServerSupabaseClient()

    const sessionResult = await validateSession(supabase, parsed.data.roomId, parsed.data.sessionId)
    if (sessionResult instanceof NextResponse) return sessionResult
    if (sessionResult.playerId !== parsed.data.playerId) {
      return NextResponse.json({ error: 'Session does not match player' }, { status: 403 })
    }

    const bluffingService = new BluffingService(supabase)

    await bluffingService.submitBluff(parsed.data)

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit bluff card'

    return NextResponse.json({ error: message }, { status: 409 })
  }
}
