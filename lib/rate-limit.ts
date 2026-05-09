const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Simple in-memory rate limiter.
 * @param key - Unique identifier (e.g. IP + endpoint)
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; resetTime: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, resetTime: now + windowMs }
  }

  entry.count += 1

  if (entry.count > maxRequests) {
    return { allowed: false, resetTime: entry.resetTime }
  }

  return { allowed: true, resetTime: entry.resetTime }
}

/**
 * Extract a client identifier from a request for rate limiting.
 * Uses x-forwarded-for, x-real-ip, or falls back to a generic key.
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  return 'unknown-client'
}

/**
 * Helper to build a rate limit key scoped to a specific endpoint.
 */
export function rateLimitKey(clientId: string, endpoint: string): string {
  return `${endpoint}:${clientId}`
}

// Periodically clean up expired entries (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}
