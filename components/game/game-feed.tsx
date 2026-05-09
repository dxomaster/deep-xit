"use client"

import { FormEvent, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useGameState } from '@/hooks/useGameState'

export default function GameFeed() {
  const [roomId, setRoomId] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [clue, setClue] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const activeRoomId = roomId.trim() || null
  const activePlayerId = playerId.trim()
  const { gameState, isLoading, error } = useGameState(activeRoomId)
  const playerHand = useMemo(() => gameState.cards.filter((card) => card.playerId === activePlayerId), [activePlayerId, gameState.cards])
  const availableBluffCards = useMemo(
    () => playerHand.filter((card) => !card.isStorytellerCard && !card.isSubmittedForRound),
    [playerHand],
  )
  const submittedRoundCards = useMemo(
    () => gameState.cards.filter((card) => card.isSubmittedForRound),
    [gameState.cards],
  )
  const visibleVotingCards = useMemo(
    () => submittedRoundCards.filter((card) => card.playerId !== activePlayerId),
    [activePlayerId, submittedRoundCards],
  )
  const currentPlayerVote = useMemo(
    () => gameState.votes.find((vote) => vote.voterId === activePlayerId),
    [activePlayerId, gameState.votes],
  )
  const hasSubmittedBluff = playerHand.some((card) => !card.isStorytellerCard && card.isSubmittedForRound)
  const isStoryteller = Boolean(activePlayerId && gameState.storytellerId === activePlayerId)
  const canSubmitStory = isStoryteller && gameState.status === 'STORYTELLING' && selectedCardId && clue.trim().length > 0
  const canSubmitBluff = !isStoryteller && gameState.status === 'BLUFFING' && selectedCardId && !hasSubmittedBluff
  const canVote = !isStoryteller && gameState.status === 'VOTING' && selectedCardId && !currentPlayerVote

  async function submitStorytellerClue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeRoomId || !activePlayerId || !selectedCardId) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    const response = await fetch('/api/storytelling/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId: activeRoomId,
        storytellerId: activePlayerId,
        cardId: selectedCardId,
        clue,
      }),
    })

    if (!response.ok) {
      const body = (await response.json()) as { error?: string }
      setSubmitError(body.error ?? 'Failed to submit clue')
      setIsSubmitting(false)
      return
    }

    setClue('')
    setSelectedCardId(null)
    setIsSubmitting(false)
  }

  async function submitBluffCard() {
    if (!activeRoomId || !activePlayerId || !selectedCardId) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    const response = await fetch('/api/bluffing/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId: activeRoomId,
        playerId: activePlayerId,
        cardId: selectedCardId,
      }),
    })

    if (!response.ok) {
      const body = (await response.json()) as { error?: string }
      setSubmitError(body.error ?? 'Failed to submit bluff card')
      setIsSubmitting(false)
      return
    }

    setSelectedCardId(null)
    setIsSubmitting(false)
  }

  async function submitVote() {
    if (!activeRoomId || !activePlayerId || !selectedCardId) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    const response = await fetch('/api/voting/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId: activeRoomId,
        voterId: activePlayerId,
        cardId: selectedCardId,
      }),
    })

    if (!response.ok) {
      const body = (await response.json()) as { error?: string }
      setSubmitError(body.error ?? 'Failed to submit vote')
      setIsSubmitting(false)
      return
    }

    setSelectedCardId(null)
    setIsSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="space-y-3">
          <Badge variant="secondary">Live Deep-Xit Room</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">{gameState.status ? `${gameState.status} phase` : 'Deep-Xit'}</h1>
          <p className="max-w-2xl text-muted-foreground">Enter a room and player id to join a live game session.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Connection</CardTitle>
              <CardDescription>These ids come from the `rooms` and `players` tables.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={roomId} onChange={(event) => setRoomId(event.target.value)} placeholder="Room UUID" />
              <Input value={playerId} onChange={(event) => setPlayerId(event.target.value)} placeholder="Current player UUID" />
              {isLoading && <p className="text-sm text-muted-foreground">Loading game state...</p>}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Game state</CardTitle>
              <CardDescription>Updated by Supabase Realtime without refreshing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline">{gameState.status ?? 'Not loaded'}</Badge>
              </div>
              <p>
                <span className="text-muted-foreground">Clue:</span> {gameState.currentClue ?? 'None yet'}
              </p>
              <p>
                <span className="text-muted-foreground">Players:</span> {gameState.players.length}
              </p>
              <p>
                <span className="text-muted-foreground">Cards:</span> {gameState.cards.length}
              </p>
              <p>
                <span className="text-muted-foreground">Round submissions:</span> {submittedRoundCards.length}
              </p>
              <p>
                <span className="text-muted-foreground">Votes:</span> {gameState.votes.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your hand</CardTitle>
            <CardDescription>
              {isStoryteller ? 'Select one card and submit a clue to move the room to BLUFFING.' : 'Select a matching card during BLUFFING.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {playerHand.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  disabled={
                    (gameState.status !== 'STORYTELLING' || !isStoryteller)
                    && (gameState.status !== 'BLUFFING' || isStoryteller || card.isSubmittedForRound || hasSubmittedBluff)
                  }
                  onClick={() => setSelectedCardId(card.id)}
                  className={`overflow-hidden rounded-xl border text-left transition ${
                    selectedCardId === card.id ? 'border-primary ring-2 ring-primary/40' : 'border-border'
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  <img src={card.imageUrl} alt="Generated Deep-Xit card" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>

            {playerHand.length === 0 && <p className="text-sm text-muted-foreground">No cards found for this player in the current room.</p>}

            {isStoryteller && gameState.status === 'STORYTELLING' && (
              <form onSubmit={submitStorytellerClue} className="flex flex-col gap-3">
                <Input value={clue} onChange={(event) => setClue(event.target.value)} placeholder="Type your clue" maxLength={140} />
                {submitError && <p className="text-sm text-destructive">{submitError}</p>}
                <Button type="submit" disabled={!canSubmitStory || isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit clue and start bluffing'}
                </Button>
              </form>
            )}

            {!isStoryteller && gameState.status === 'BLUFFING' && (
              <div className="flex flex-col gap-3">
                {hasSubmittedBluff ? (
                  <p className="text-sm text-muted-foreground">Your bluff card is submitted. Waiting for other players...</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Clue: {gameState.currentClue}</p>
                    {submitError && <p className="text-sm text-destructive">{submitError}</p>}
                    <Button type="button" disabled={!canSubmitBluff || isSubmitting || availableBluffCards.length === 0} onClick={submitBluffCard}>
                      {isSubmitting ? 'Submitting...' : 'Submit bluff card'}
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {gameState.status === 'VOTING' && (
          <Card>
            <CardHeader>
              <CardTitle>Voting</CardTitle>
              <CardDescription>Pick the storyteller card. Your own submitted card is hidden from your voting choices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleVotingCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    disabled={Boolean(currentPlayerVote) || isStoryteller}
                    onClick={() => setSelectedCardId(card.id)}
                    className={`overflow-hidden rounded-xl border text-left transition ${
                      selectedCardId === card.id ? 'border-primary ring-2 ring-primary/40' : 'border-border'
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <img src={card.imageUrl} alt="Submitted Deep-Xit card" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>

              {isStoryteller && <p className="text-sm text-muted-foreground">The storyteller does not vote.</p>}
              {currentPlayerVote && <p className="text-sm text-muted-foreground">Your vote has been recorded.</p>}
              {submitError && <p className="text-sm text-destructive">{submitError}</p>}
              {!isStoryteller && !currentPlayerVote && (
                <Button type="button" disabled={!canVote || isSubmitting} onClick={submitVote}>
                  {isSubmitting ? 'Submitting...' : 'Submit vote'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {gameState.status === 'SCORING' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Round results</CardTitle>
                <CardDescription>
                  The storyteller card has been revealed. Scores have been updated automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {submittedRoundCards.map((card) => {
                    const owner = gameState.players.find((player) => player.id === card.playerId)
                    const voteCount = gameState.votes.filter((vote) => vote.cardId === card.id).length

                    return (
                      <div
                        key={card.id}
                        className={`overflow-hidden rounded-xl border ${card.isStorytellerCard ? 'border-primary ring-2 ring-primary/40' : 'border-border'}`}
                      >
                        <img src={card.imageUrl} alt="Round card" className="aspect-square w-full object-cover" />
                        <div className="flex items-center justify-between px-3 py-2 text-xs">
                          <span className="font-medium">{owner?.displayName ?? 'Unknown'}</span>
                          <div className="flex items-center gap-2">
                            {card.isStorytellerCard && <Badge variant="default">Storyteller</Badge>}
                            <Badge variant="outline">{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scoreboard</CardTitle>
                <CardDescription>Updated player scores after this round.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {[...gameState.players].sort((left, right) => right.score - left.score).map((player) => (
                    <div key={player.id} className="flex items-center justify-between py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{player.displayName}</span>
                        {player.id === gameState.storytellerId && <Badge variant="secondary">Storyteller</Badge>}
                      </div>
                      <span className="tabular-nums font-semibold">{player.score} pts</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </section>
    </main>
  )
}
