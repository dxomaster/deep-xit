const SESSION_KEY = 'deep-xit-session-id'

export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  let sessionId = localStorage.getItem(SESSION_KEY)

  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }

  return sessionId
}

export function getPlayerIdForRoom(roomId: string): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem(`deep-xit-player:${roomId}`)
}

export function setPlayerIdForRoom(roomId: string, playerId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(`deep-xit-player:${roomId}`, playerId)
}
