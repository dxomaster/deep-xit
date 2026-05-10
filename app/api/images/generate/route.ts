import { NextResponse } from 'next/server'
import { z } from 'zod'
import { togetherImageService } from '@/lib/image-generation/together-image-service'
import { applyRateLimit } from '@/lib/api-guard'

export const runtime = 'nodejs'

const requestSchema = z.object({
  theme: z.string().trim().min(1),
  count: z.number().int().min(1).max(12).optional(),
})

export async function POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'images-generate', 3, 60000)
  if (rateLimited) return rateLimited

  const parsed = requestSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid image generation request' }, { status: 400 })
  }

  try {
    const images = await togetherImageService.generateDixitImages(parsed.data)

    return NextResponse.json({ images })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation failed'

    return NextResponse.json({ error: message }, { status: 502 })
  }
}
