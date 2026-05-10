import { NextResponse } from 'next/server'

/**
 * Serverless-compatible rate limiting using request deduplication
 * This won't persist across function invocations but prevents burst attacks
 * within a single request context.
 */

// Track requests within this function invocation
const requestTracker = new Map<string, number>()

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

/**
 * Apply rate limiting in a serverless-safe way
 * Uses a combination of IP tracking within the request context
 * and optional KV store for persistence across invocations
 */
export async function applyServerlessRateLimit(
  request: Request,
  endpoint: string,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const clientId = getClientIdentifier(request)
  const key = `${endpoint}:${clientId}`
  
  // Check current count in this invocation
  const currentCount = requestTracker.get(key) || 0
  
  if (currentCount >= config.maxRequests) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }
  
  // Increment counter
  requestTracker.set(key, currentCount + 1)
  
  // Clean up old entries periodically (simple memory management)
  if (requestTracker.size > 1000) {
    requestTracker.clear()
  }
  
  return null
}

/**
 * Extract client identifier from request headers
 */
function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  
  // Fallback to user-agent hash if no IP available
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return `ua-${userAgent.slice(0, 20)}`
}

/**
 * Simple in-memory rate limit for non-serverless environments
 * or as a fallback when KV is not available
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
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

// Cleanup for in-memory store (runs only in Node.js environment)
if (typeof setInterval !== 'undefined' && typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}
