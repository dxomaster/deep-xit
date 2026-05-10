import { NextResponse } from 'next/server'
import { z } from 'zod'
import { GenerateHandService } from '@/lib/game/generate-hand-service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { applyRateLimit, validateSession } from '@/lib/api-guard'

export const runtime = 'nodejs'

const requestSchema = z.object({
  roomId: z.string().uuid(),
  playerId: z.string().uuid(),
  theme: z.string().trim().min(1),
  count: z.number().int().min(1).max(12).optional(),
  sessionId: z.string().min(1),
})

export async function POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'hands-generate', 5, 60000)
  if (rateLimited) return rateLimited

  const parsed = requestSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid generate hand request' }, { status: 400 })
  }

  try {
    const supabase = createServerSupabaseClient()

    const sessionResult = await validateSession(supabase, parsed.data.roomId, parsed.data.sessionId)
    if (sessionResult instanceof NextResponse) return sessionResult
    if (sessionResult.playerId !== parsed.data.playerId) {
      return NextResponse.json({ error: 'Session does not match player' }, { status: 403 })
    }

    const generateHandService = new GenerateHandService(supabase)
    const cards = await generateHandService.generateHand(parsed.data)

    return NextResponse.json({ cards }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate hand'
    const status = message.includes('does not belong') || message.includes('already has') ? 409 : 502

    return NextResponse.json({ error: message }, { status })
  }
}
