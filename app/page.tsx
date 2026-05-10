"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

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

    try {
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

      const data = await response.json()
      const { room } = data as { room: { id: string } }
      if (!room?.id) {
        setError('Failed to get room ID')
        setIsCreating(false)
        return
      }
      router.push(`/room/${room.id}`)
    } catch (err) {
      setError('Failed to create room. Please try again.')
      setIsCreating(false)
    }
  }

  function joinRoom() {
    const id = joinCode.trim()

    if (!id) {
      return
    }

    router.push(`/room/${id}`)
  }

  return (
    <main className="game-bg relative min-h-screen px-5 py-10">
      {/* Atmospheric layers — outside flex flow so they don't shift content */}
      <div className="stars-layer" />
      <div className="nebula-left" />
      <div className="nebula-right" />

      {/* Centered content column */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
      <motion.div
        className="flex w-full max-w-md flex-col items-center gap-8"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Title */}
        <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: 'easeOut' }} className="space-y-3 text-center">
          <h1
            className="title-gold text-5xl font-black tracking-[0.18em]"
            style={{ fontVariant: 'small-caps' }}
          >
            Deep-Xit
          </h1>
          <p className="text-sm italic text-[#c8bedd]/80 font-serif tracking-wide">
            A celestial storytelling game with AI-conjured visions
          </p>
        </motion.div>

        {/* Create panel */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: 'easeOut' }} className="glass-panel w-full p-6 text-center">
          <h2 className="mb-1 font-['Cinzel'] text-base font-semibold uppercase tracking-[0.1em] text-[#d4af5a]">
            Create a New Game
          </h2>
          <p className="mb-5 text-sm italic text-muted-foreground">Begin a room and share the code with your companions.</p>

          <input
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
            placeholder="Game theme — e.g. 'dreams', 'forgotten kingdoms'"
            maxLength={100}
            onKeyDown={(event) => { if (event.key === 'Enter') createRoom() }}
            className="input-celestial mb-3 w-full px-4 py-3 text-sm"
          />

          <div className="mb-3 flex items-center justify-center gap-3">
            <input
              type="checkbox"
              id="useAI"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="h-4 w-4 rounded border-[rgba(197,160,89,0.5)] bg-purple-deep/60 accent-[#c5a059]"
            />
            <label htmlFor="useAI" className="text-sm text-foreground/90">
              Use AI-generated images
            </label>
          </div>

          <div className="mb-5 flex items-center justify-center gap-3">
            <label htmlFor="maxRounds" className="text-sm text-foreground/90">
              Max rounds:
            </label>
            <input
              type="number"
              id="maxRounds"
              min="1"
              max="50"
              value={maxRounds}
              onChange={(e) => setMaxRounds(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
              className="input-celestial w-20 px-3 py-2 text-center text-sm"
            />
          </div>

          <motion.button
            className="btn-gold w-full"
            onClick={createRoom}
            disabled={isCreating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {isCreating ? 'Conjuring…' : 'Create Room'}
          </motion.button>
        </motion.div>

        {/* Ornate OR divider */}
        <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c5a059]/55 to-transparent" />
          <span className="font-['Cinzel'] text-[11px] tracking-[0.45em] text-[#c5a059]/60">✦ OR ✦</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c5a059]/55 to-transparent" />
        </motion.div>

        {/* Join panel */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: 'easeOut' }} className="glass-panel w-full p-6 text-center">
          <h2 className="mb-1 font-['Cinzel'] text-base font-semibold uppercase tracking-[0.1em] text-[#d4af5a]">
            Join a Game
          </h2>
          <p className="mb-5 text-sm italic text-muted-foreground">Enter the room ID shared by your host.</p>

          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
            placeholder="Room ID"
            onKeyDown={(event) => { if (event.key === 'Enter') joinRoom() }}
            className="input-celestial mb-4 w-full px-4 py-3 text-sm"
          />

          <motion.button
            className="btn-gold w-full"
            onClick={joinRoom}
            disabled={!joinCode.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Enter the Realm
          </motion.button>
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm text-destructive font-serif italic"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
      </div>
    </main>
  )
}