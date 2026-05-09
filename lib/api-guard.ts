import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier, rateLimitKey } from '@/lib/rate-limit'

/**
 * Apply rate limiting to a request. Returns a 429 response if rate limited, or null if allowed.
 * @param request - The incoming request
 * @param endpoint - A unique name for the endpoint (used as rate limit key prefix)
 * @param maxRequests - Max requests per window (default: 15)
 * @param windowMs - Time window in ms (default: 60000 = 1 minute)
 */
export function applyRateLimit(
  request: Request,
  endpoint: string,
  maxRequests = 15,
  windowMs = 60000,
): NextResponse | null {
  const clientId = getClientIdentifier(request)
  const key = rateLimitKey(clientId, endpoint)
  const { allowed, resetTime } = checkRateLimit(key, maxRequests, windowMs)

  if (!allowed) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': retryAfter.toString() },
      },
    )
  }

  return null
}

/**
 * Validate that the sessionId in the request body maps to a real player in the given room.
 * Returns null if valid, or a NextResponse error if invalid.
 */
export async function validateSession(
  supabase: any,
  roomId: string,
  sessionId: string | undefined,
): Promise<{ playerId: string } | NextResponse> {
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 401 })
  }

  const { data: player, error } = await supabase
    .from('players')
    .select('id')
    .eq('room_id', roomId)
    .eq('session_id', sessionId)
    .maybeSingle()

  if (error || !player) {
    return NextResponse.json({ error: 'Unauthorized: invalid session for this room' }, { status: 403 })
  }

  return { playerId: player.id }
}
