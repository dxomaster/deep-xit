"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [theme, setTheme] = useState('')
  const [useAI, setUseAI] = useState(true)
  const [maxRounds, setMaxRounds] = useState(10)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createRoom() {
    const themeValue = theme.trim()
    if (!themeValue) {
      setError('Please enter a theme for the game')
      return
    }

    setIsCreating(true)
    setError(null)

    const response = await fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: themeValue, useAI, maxRounds }),
    })

    if (!response.ok) {
      const body = (await response.json()) as { error?: string }
      setError(body.error ?? 'Failed to create room')
      setIsCreating(false)
      return
    }

    const { room } = (await response.json()) as { room: { id: string } }
    router.push(`/room/${room.id}`)
  }

  function joinRoom() {
    const id = joinCode.trim()

    if (!id) {
      return
    }

    router.push(`/room/${id}`)
  }

  return (
    <main className="game-bg flex min-h-screen items-center justify-center px-6 py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-10">
        {/* Title */}
        <div className="space-y-4 text-center">
          <h1 className="text-5xl font-bold tracking-[0.15em] text-[#c5a059] font-serif" style={{ fontVariant: 'small-caps' }}>
            Deep-Xit
          </h1>
          <p className="text-sm text-[#e2e8f0]">
            A creative storytelling game with AI-generated art
          </p>
        </div>

        {/* Create */}
        <div className="glass-panel w-full p-6 text-center">
          <h2 className="mb-1 text-lg font-semibold text-foreground">Create a new game</h2>
          <p className="mb-5 text-sm text-muted-foreground">Start a room and share the code with friends.</p>
          <input
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
            placeholder="Game theme (e.g., 'dreams', 'underwater world')"
            maxLength={100}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                createRoom()
              }
            }}
            className="mb-3 w-full rounded-lg border border-border bg-purple-deep/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
          />
          <div className="mb-3 flex items-center justify-center gap-3">
            <input
              type="checkbox"
              id="useAI"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="h-4 w-4 rounded border-gold bg-purple-deep/60 text-gold focus:ring-gold/50"
            />
            <label htmlFor="useAI" className="text-sm text-foreground">
              Use AI-generated images (Together AI)
            </label>
          </div>
          <div className="mb-3 flex items-center justify-center gap-2">
            <label htmlFor="maxRounds" className="text-sm text-foreground">
              Max rounds:
            </label>
            <input
              type="number"
              id="maxRounds"
              min="1"
              max="50"
              value={maxRounds}
              onChange={(e) => setMaxRounds(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
              className="w-20 rounded-lg border border-border bg-purple-deep/60 px-3 py-2 text-sm text-foreground text-center focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
          </div>
          <button className="btn-gold w-full" onClick={createRoom} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex w-full items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs tracking-widest text-muted-foreground">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Join */}
        <div className="glass-panel w-full p-6 text-center">
          <h2 className="mb-1 text-lg font-semibold text-foreground">Join an existing game</h2>
          <p className="mb-5 text-sm text-muted-foreground">Paste the room ID shared by the host.</p>
          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
            placeholder="Room ID"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                joinRoom()
              }
            }}
            className="mb-3 w-full rounded-lg border border-border bg-purple-deep/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
          />
          <button
            className="btn-gold w-full opacity-80 hover:opacity-100"
            onClick={joinRoom}
            disabled={!joinCode.trim()}
            style={{ background: 'rgba(60, 40, 90, 0.6)', color: '#d4c8e8', border: '1px solid rgba(140, 100, 200, 0.3)' }}
          >
            Join Room
          </button>
        </div>

        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </div>
    </main>
  )
}