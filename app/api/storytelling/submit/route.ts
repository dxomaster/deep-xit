import { NextResponse } from 'next/server'
import { z } from 'zod'
import { StorytellingService } from '@/lib/game/storytelling-service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { applyRateLimit, validateSession } from '@/lib/api-guard'

export const runtime = 'nodejs'

const requestSchema = z.object({
  roomId: z.string().uuid(),
  storytellerId: z.string().uuid(),
  cardId: z.string().uuid(),
  clue: z.string().trim().min(1).max(140),
  sessionId: z.string().min(1),
})

export async function POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'storytelling-submit', 15, 60000)
  if (rateLimited) return rateLimited

  const parsed = requestSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid storyteller submission' }, { status: 400 })
  }

  try {
    const supabase = createServerSupabaseClient()

    const sessionResult = await validateSession(supabase, parsed.data.roomId, parsed.data.sessionId)
    if (sessionResult instanceof NextResponse) return sessionResult
    if (sessionResult.playerId !== parsed.data.storytellerId) {
      return NextResponse.json({ error: 'Session does not match storyteller' }, { status: 403 })
    }

    const storytellingService = new StorytellingService(supabase)

    await storytellingService.submitClue(parsed.data)

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit storyteller clue'

    return NextResponse.json({ error: message }, { status: 409 })
  }
}
