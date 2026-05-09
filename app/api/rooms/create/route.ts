import { NextResponse } from 'next/server'
import { z } from 'zod'
import { RoomService } from '@/lib/game/room-service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/api-guard'

export const runtime = 'nodejs'

const requestSchema = z.object({
  theme: z.string().trim().min(1).max(200),
  useAI: z.boolean().optional(),
  maxRounds: z.number().min(1).max(50).optional(),
})

export async function POST(request: Request) {
  const rateLimited = applyRateLimit(request, 'rooms-create', 5, 60000)
  if (rateLimited) return rateLimited

  const parsed = requestSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: 'Theme is required' }, { status: 400 })
  }

  try {
    const supabase = createServerSupabaseClient()
    const roomService = new RoomService(supabase)
    const room = await roomService.createRoom(parsed.data.theme, parsed.data.useAI ?? true, parsed.data.maxRounds ?? 10)

    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create room'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
