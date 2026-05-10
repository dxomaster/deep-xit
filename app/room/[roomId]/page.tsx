"use client"

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameState, type GameState } from '@/hooks/useGameState'
import type { Card as GameCard, ScoreDelta, Vote, Card, Player } from '@/lib/game/types'
import { getPlayerIdForRoom, getSessionId, setPlayerIdForRoom } from '@/lib/session'
import { getCynicalRoundMessage, getWinnerSarcasticMessage } from '@/lib/game/round-messages'
import { sanitizeDisplayText } from '@/lib/sanitize'

export default function RoomPage() {
  const params = useParams<{ roomId: string }>()
  const router = useRouter()
  const roomId = params.roomId

  console.log('RoomPage loaded with roomId:', roomId)

  const [playerId, setPlayerId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [clue, setClue] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [feedMessages, setFeedMessages] = useState<string[]>([])
  const [scoreDeltas, setScoreDeltas] = useState<ScoreDelta[]>([])
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [lastSarcasticMessage, setLastSarcasticMessage] = useState<string>('')
  const [hasGeneratedSarcasticMessage, setHasGeneratedSarcasticMessage] = useState(false)
  const scoringRoundRef = useRef<number | null>(null)

  const loadingMessages = [
    'The cards are being summoned from the beyond...',
    'Whispers of imagination are taking shape...',
    'Dreams are crystallizing into art...',
    'The ethereal realm is crafting visions...',
    'Ancient magic weaves new tapestries...',
    'Cosmic energies coalesce into form...',
    'The void births new possibilities...',
    'Mystical forces paint the canvas...',
    'Otherworldly inspirations manifest...',
    'The universe conjures hidden wonders...',
    'Enchanted realms reveal their secrets...',
    'Timeless tales materialize before us...',
    'The dreamweaver spins new stories...',
    'Celestial artists brush the stars...',
    'Forgotten myths awaken from slumber...',
    'The arcane ritual continues...',
    'Visions from the ether emerge...',
    'The great mystery unfolds...',
    'Spirits of creativity dance...',
    'The impossible becomes reality...',
    'Portals to imagination open wide...',
    'The fabric of dreams is woven...',
    'Ethereal beings lend their gifts...',
    'The cosmos aligns its forces...',
    'Ancient wisdom flows through art...',
    'The boundaries of reality dissolve...',
    'Magical energies surge and swirl...',
    'The unseen world makes itself known...',
    'Dreams take physical form at last...',
    'The mystical arts work their wonder...',
    'Dimensions converge in this moment...',
    'The spirit of creation awakens...',
    'Infinite possibilities unfold...',
    'The sacred geometry manifests...',
    'The alchemy of art transforms...',
    'The divine inspiration descends...',
    'The collective unconscious speaks...',
    'The realm of fantasy bleeds through...',
    'The archetypes awaken from slumber...',
    'The symbols of power materialize...',
    'The ancient seals are broken...',
    'The gates of perception open...',
    'The hidden patterns reveal themselves...',
    'The cosmic dance accelerates...',
    'The elemental forces harmonize...',
    'The spiritual energies intensify...',
    'The mystical currents flow...',
    'The sacred sounds resonate...',
    'The divine light illuminates...',
    'The creative spark ignites...',
    'The artistic vision clarifies...',
    'The imagination runs wild...',
    'The dream logic prevails...',
    'The surreal becomes real...',
    'The impossible becomes possible...',
    'The unseen becomes visible...',
    'The unheard becomes audible...',
    'The unknown becomes known...',
    'The formless takes form...',
    'The abstract becomes concrete...',
    'The potential becomes actual...',
    'The hidden becomes revealed...',
    'The dormant awakens...',
    'The silent speaks...',
    'The still moves...',
    'The dark lights up...',
    'The cold warms...',
    'The empty fills...',
    'The chaos orders...',
    'The complex simplifies...',
    'The mystery solves...',
    'The question answers...',
    'The search finds...',
    'The journey arrives...',
    'The longing fulfills...',
    'The hoping realizes...',
    'The dreaming manifests...',
    'The wishing grants...',
    'The desiring receives...',
    'The needing satisfies...',
    'The wanting obtains...',
    'The seeking discovers...',
    'The exploring finds...',
    'The venturing succeeds...',
    'The daring triumphs...',
    'The risking rewards...',
    'The trying achieves...',
    'The attempting accomplishes...',
    'The striving completes...',
    'The reaching grasps...',
    'The stretching touches...',
    'The extending connects...',
    'The expanding embraces...',
    'The growing matures...',
    'The developing evolves...',
    'The progressing advances...',
    'The moving forwards...',
    'The going proceeds...',
    'The walking steps...',
    'The running races...',
    'The flying soars...',
    'The swimming dives...',
    'The climbing ascends...',
    'The jumping leaps...',
    'The falling lands...',
    'The rising elevates...',
    'The sinking descends...',
    'The floating drifts...',
    'The sailing voyages...',
    'The traveling journeys...',
    'The wandering roams...',
    'The exploring discovers...',
    'The adventuring experiences...',
    'The pioneering leads...',
    'The forging creates...',
    'The building constructs...',
    'The making produces...',
    'The crafting shapes...',
    'The forming molds...',
    'The designing plans...',
    'The inventing innovates...',
    'The creating generates...',
    'The originating initiates...',
    'The beginning starts...',
    'The starting launches...',
    'the commencing begins...',
    'The initiating starts off...',
    'The opening unlocks...',
    'The unlocking releases...',
    'The freeing liberates...',
    'The liberating emancipates...',
    'The releasing discharges...',
    'The discharging expels...',
    'The expelling ejects...',
    'The ejecting throws out...',
    'The throwing out discards...',
    'The discarding rejects...',
    'The rejecting refuses...',
    'The refusing declines...',
    'The declining denies...',
    'The denying contradicts...',
    'The contradicting opposes...',
    'The opposing resists...',
    'The resisting withstands...',
    'The withstanding endures...',
    'The enduring lasts...',
    'The lasting continues...',
    'The continuing persists...',
    'The persisting remains...',
    'The remaining stays...',
    'The staying lingers...',
    'The lingering tarries...',
    'The tarrying delays...',
    'The deferring postpones...',
    'The postponing puts off...',
    'The putting off delays...',
    'The delaying procrastinates...',
    'The procrastinating hesitates...',
    'The hesitating wavers...',
    'The wavering fluctuates...',
    'The fluctuating varies...',
    'The varying changes...',
    'The changing alters...',
    'The altering modifies...',
    'The modifying adjusts...',
    'The adapting accommodates...',
    'The accommodating suits...',
    'The fitting matches...',
    'The corresponding relates...',
    'The relating connects...',
    'The connecting links...',
    'The linking joins...',
    'The joining unites...',
    'The uniting combines...',
    'The combining merges...',
    'The merging blends...',
    'The blending mixes...',
    'The mixing mingles...',
    'The mingling socializes...',
    'The socializing interacts...',
    'The communicating exchanges...',
    'The exchanging trades...',
    'The swapping switches...',
    'The switching changes...',
    'The converting transforms...',
    'The transforming metamorphoses...',
    'The metamorphosing evolves...',
    'The developing grows...',
    'The maturing ripens...',
    'The ripening ages...',
    'The aging withers...',
    'The withering fades...',
    'The fading disappears...',
    'The vanishing evaporates...',
    'The evaporating vaporizes...',
    'The vaporizing gaseous...',
    'The gaseous expanding...',
    'The expanding spreading...',
    'The scattering dispersing...',
    'The dispersing distributing...',
    'The circulating flowing...',
    'The flowing streaming...',
    'The pouring raining...',
    'The raining storming...',
    'The storming thundering...',
    'The thundering booming...',
    'The blasting exploding...',
    'The erupting bursting...',
    'The bursting breaking...',
    'The shattering crashing...',
    'The collapsing falling...',
    'The tumbling rolling...',
    'The sliding slipping...',
    'The skidding sliding...',
    'The gliding soaring...',
    'The hovering floating...',
    'The drifting wandering...',
    'The roaming traveling...',
    'The journeying trekking...',
    'The hiking climbing...',
    'The scaling ascending...',
    'The rising lifting...',
    'The elevating raising...',
    'The hoisting lifting...',
    'The pulling dragging...',
    'The towing hauling...',
    'The carrying transporting...',
    'The conveying delivering...',
    'The transmitting sending...',
    'The dispatching shipping...',
    'The mailing posting...',
    'The publishing printing...',
    'The printing reproducing...',
    'The copying duplicating...',
    'The replicating cloning...',
    'The reproducing breeding...',
    'The multiplying increasing...',
    'The adding summing...',
    'The totaling calculating...',
    'The computing processing...',
    'The analyzing examining...',
    'The inspecting checking...',
    'The testing trying...',
    'The experimenting probing...',
    'The investigating researching...',
    'The studying learning...',
    'The teaching educating...',
    'The training instructing...',
    'The guiding directing...',
    'The leading steering...',
    'The governing ruling...',
    'The controlling managing...',
    'The supervising overseeing...',
    'The watching observing...',
    'The witnessing seeing...',
    'The viewing watching...',
    'The looking gazing...',
    'The staring glaring...',
    'The glaring scowling...',
    'The frowning sulking...',
    'The pouting moping...',
    'The moping brooding...',
    'The brooding pondering...',
    'The contemplating reflecting...',
    'The meditating thinking...',
    'The considering weighing...',
    'The evaluating assessing...',
    'The judging determining...',
    'The deciding concluding...',
    'The resolving settling...',
    'The solving answering...',
    'The responding reacting...',
    'The replying answering...',
    'The retorting countering...',
    'The contradicting disputing...',
    'The debating arguing...',
    'The discussing conversing...',
    'The chatting talking...',
    'The speaking voicing...',
    'The uttering vocalizing...',
    'The articulating expressing...',
    'The conveying communicating...',
    'The transmitting broadcasting...',
    'The announcing declaring...',
    'The proclaiming announcing...',
    'The revealing disclosing...',
    'The exposing uncovering...',
    'The discovering finding...',
    'The locating spotting...',
    'The identifying recognizing...',
    'The distinguishing differentiating...',
    'The discriminating distinguishing...',
    'The selecting choosing...',
    'The preferring favoring...',
    'The liking enjoying...',
    'The loving adoring...',
    'The hating detesting...',
    'The despising loathing...',
    'The fearing dreading...',
    'The dreading apprehending...',
    'The anticipating expecting...',
    'The hoping wishing...',
    'The dreaming fantasizing...',
    'The imagining visualizing...',
    'The picturing envisioning...',
    'The foreseeing predicting...',
    'The prophesying foretelling...',
    'The warning cautioning...',
    'The alerting notifying...',
    'The informing advising...',
    'The counseling guiding...',
    'The mentoring coaching...',
    'The teaching training...',
    'The educating instructing...',
    'The learning studying...',
    'The researching investigating...',
    'The exploring discovering...',
    'The inventing creating...',
    'The designing planning...',
    'The building constructing...',
    'The making manufacturing...',
    'The producing generating...',
    'The creating originating...',
    'The founding establishing...',
    'The starting initiating...',
    'The beginning commencing...',
    'The finishing completing...',
    'The ending concluding...',
    'The stopping halting...',
    'The pausing waiting...',
    'The resting relaxing...',
    'The sleeping dreaming...',
    'The waking arising...',
    'The standing rising...',
    'The sitting seating...',
    'The lying reclining...',
    'The walking strolling...',
    'The running sprinting...',
    'The jumping leaping...',
    'The diving plunging...',
    'The swimming paddling...',
    'The flying soaring...',
    'The driving steering...',
    'The riding traveling...',
    'The sailing navigating...',
    'The boating cruising...',
    'The floating drifting...',
    'The sinking dropping...',
    'The falling plunging...',
    'The rising ascending...',
    'The climbing scaling...',
    'The descending dropping...',
    'The entering entering...',
    'The exiting leaving...',
    'The arriving coming...',
    'The departing going...',
    'The staying remaining...',
    'The leaving departing...',
    'The returning coming back...',
    'The going away leaving...',
    'The approaching nearing...',
    'The receding moving away...',
    'The advancing moving forward...',
    'The retreating moving back...',
    'The progressing moving ahead...',
    'The regressing moving backward...',
    'The improving getting better...',
    'The worsening getting worse...',
    'The growing increasing...',
    'The shrinking decreasing...',
    'The expanding spreading...',
    'The contracting shrinking...',
    'The strengthening reinforcing...',
    'The weakening undermining...',
    'The building constructing...',
    'The destroying demolishing...',
    'The creating making...',
    'The destroying breaking...',
    'The preserving protecting...',
    'The conserving saving...',
    'The wasting squandering...',
    'The spending paying...',
    'The earning making...',
    'The losing misplacing...',
    'The finding discovering...',
    'The seeking searching...',
    'The hiding concealing...',
    'The revealing showing...',
    'The covering protecting...',
    'The uncovering exposing...',
    'The shielding guarding...',
    'The attacking assaulting...',
    'The defending protecting...',
    'The fighting battling...',
    'The warring combating...',
    'The peacemaking reconciling...',
    'The harmonizing balancing...',
    'The organizing arranging...',
    'The disordering scattering...',
    'The cleaning tidying...',
    'The dirtying soiling...',
    'The polishing shining...',
    'The dulling dimming...',
    'The brightening lighting...',
    'The darkening shading...',
    'The coloring painting...',
    'The drawing sketching...',
    'The writing composing...',
    'The reading perusing...',
    'The speaking uttering...',
    'The listening hearing...',
    'The understanding comprehending...',
    'The misunderstanding misinterpreting...',
    'The explaining clarifying...',
    'The confusing puzzling...',
    'The solving resolving...',
    'The complicating complexifying...',
    'The simplifying reducing...',
    'The expanding enlarging...',
    'The contracting reducing...',
    'The lengthening extending...',
    'The shortening abbreviating...',
    'The heightening raising...',
    'The lowering dropping...',
    'The widening broadening...',
    'The narrowing tightening...',
    'The thickening fattening...',
    'The thinning slimming...',
    'The strengthening fortifying...',
    'The weakening debilitating...',
    'The healing curing...',
    'The sickening infecting...',
    'The feeding nourishing...',
    'The starving depriving...',
    'The watering hydrating...',
    'The drying dehydrating...',
    'The heating warming...',
    'The cooling chilling...',
    'The freezing solidifying...',
    'The melting liquefying...',
    'The evaporating vaporizing...',
    'The condensing liquefying...',
    'The solidifying hardening...',
    'The softening weakening...',
    'The hardening strengthening...',
    'The sharpening honing...',
    'The dulling blunting...',
    'The smoothing polishing...',
    'The roughening texturing...',
    'The cleaning purifying...',
    'The dirtying contaminating...',
    'The freshening renewing...',
    'The aging deteriorating...',
    'The rejuvenating revitalizing...',
    'The preserving conserving...',
    'The destroying ruining...',
    'The protecting shielding...',
    'The exposing revealing...',
    'The concealing hiding...',
    'The displaying showing...',
    'The hiding concealing...',
    'The exhibiting presenting...',
    'The withdrawing removing...',
    'The adding including...',
    'The subtracting removing...',
    'The multiplying increasing...',
    'The dividing separating...',
    'The combining joining...',
    'The separating dividing...',
    'The connecting linking...',
    'The disconnecting severing...',
    'The attaching fastening...',
    'The detaching removing...',
    'The bonding joining...',
    'The breaking separating...',
    'The mending repairing...',
    'The damaging harming...',
    'The healing curing...',
    'The hurting injuring...',
    'The helping assisting...',
    'The hindering obstructing...',
    'The supporting backing...',
    'The opposing resisting...',
    'The agreeing concurring...',
    'The disagreeing dissenting...',
    'The approving endorsing...',
    'The disapproving rejecting...',
    'The accepting receiving...',
    'The rejecting refusing...',
    'The welcoming greeting...',
    'The rejecting spurning...',
    'The embracing hugging...',
    'The pushing shoving...',
    'The pulling dragging...',
    'The lifting raising...',
    'The dropping falling...',
    'The throwing tossing...',
    'The catching grabbing...',
    'The hitting striking...',
    'The missing failing...',
    'The winning succeeding...',
    'The losing failing...',
    'The succeeding triumphing...',
    'The failing flopping...'
  ]

  const { gameState, isLoading, error } = useGameState(roomId, playerId)

  // Derived values using useMemo (must be defined before useEffects that depend on them)
  const currentPlayer = useMemo(() => gameState.players.find((p) => p.id === playerId), [gameState.players, playerId])
  const playerHand = useMemo(() => gameState.cards.filter((card) => card.playerId === playerId), [gameState.cards, playerId])
  const submittedRoundCards = useMemo(() => gameState.cards.filter((card) => card.isSubmittedForRound), [gameState.cards])
  const visibleVotingCards = useMemo(() => submittedRoundCards.filter((card) => card.playerId !== playerId), [submittedRoundCards, playerId])
  const currentPlayerVote = useMemo(() => gameState.votes.find((vote) => vote.voterId === playerId), [gameState.votes, playerId])

  // Core player state derived values
  const hasSubmittedBluff = playerHand.some((card) => !card.isStorytellerCard && card.isSubmittedForRound)
  const isStoryteller = Boolean(playerId && gameState.storytellerId === playerId)
  const storytellerPlayer = gameState.players.find((p) => p.id === gameState.storytellerId)
  const storytellerName = useMemo(() => storytellerPlayer?.displayName ?? 'Storyteller', [storytellerPlayer?.displayName])

  // Show loading animation if game state indicates images are being generated
  const showLoadingAnimation = gameState.isGeneratingImages

  // Pick a random loading message when generating images - using useMemo to avoid unnecessary re-renders
  const loadingMessage = useMemo(() => {
    if (gameState.isGeneratingImages) {
      return loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
    }
    return ''
  }, [gameState.isGeneratingImages])

  useEffect(() => {
    const stored = getPlayerIdForRoom(roomId)
    if (stored) setPlayerId(stored)
  }, [roomId])

  // Consolidated status change handler
  useEffect(() => {
    if (!gameState.status) return
    
    const labels: Record<string, string> = {
      LOBBY: 'Waiting for players...',
      STORYTELLING: `${storytellerName} is choosing a card...`,
      BLUFFING: 'Players are bluffing!',
      VOTING: 'Voting has started!',
      SCORING: 'Round complete!',
    }
    
    const msg = labels[gameState.status]
    if (msg) {
      setFeedMessages((prev) => {
        if (prev[prev.length - 1] === msg) return prev
        return [...prev.slice(-4), msg]
      })
    }

    // Reset states based on game phase
    if (gameState.status === 'LOBBY') {
      setLastSarcasticMessage('')
      setHasGeneratedSarcasticMessage(false)
      scoringRoundRef.current = null
    } else if (gameState.status !== 'SCORING') {
      setScoreDeltas([])
      setHasGeneratedSarcasticMessage(false)
      setLastSarcasticMessage('')
    }
    
    // Clear loading/submitting states when transitioning to active phases
    if (gameState.status === 'STORYTELLING' || gameState.status === 'BLUFFING') {
      setIsGeneratingImages(false)
      setIsSubmitting(false)
    }
  }, [gameState.status, storytellerName])

  useEffect(() => {
    if (gameState.status === 'SCORING') {
      // Only generate sarcastic message once per SCORING phase per round
      if (scoringRoundRef.current !== gameState.currentRound) {
        scoringRoundRef.current = gameState.currentRound
        const cynicalMsg = getCynicalRoundMessage(gameState, gameState.votes, gameState.cards)
        setLastSarcasticMessage(cynicalMsg)
        setHasGeneratedSarcasticMessage(true)
        setFeedMessages((prev) => {
          if (prev[prev.length - 1] === cynicalMsg) return prev
          return [...prev.slice(-4), cynicalMsg]
        })
      }
      if (scoreDeltas.length === 0) {
        fetch('/api/scoring/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, sessionId: getSessionId() }),
        })
          .then((res) => res.json())
          .then((body) => {
            if (body.deltas) setScoreDeltas(body.deltas)
          })
          .catch(() => {})
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.status])

  useEffect(() => {
    if (gameState.status === 'SCORING' && gameState.currentRound >= gameState.maxRounds) {
      // End the game if max rounds reached
      fetch('/api/scoring/end-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, sessionId: getSessionId() }),
      }).catch(() => {})
    }
  }, [gameState.status, gameState.currentRound, gameState.maxRounds])

  async function joinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = sanitizeDisplayText(displayName, 30)
    if (!name) return

    console.log('Joining room with roomId:', roomId)
    setIsJoining(true)
    setSubmitError(null)

    const response = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, displayName: name, sessionId: getSessionId() }),
    })

    if (!response.ok) {
      const body = (await response.json()) as { error?: string }
      setSubmitError(body.error ?? 'Failed to join room')
      setIsJoining(false)
      return
    }

    const { player } = (await response.json()) as { player: { id: string } }
    console.log('Joined successfully, player ID:', player.id)
    setPlayerIdForRoom(roomId, player.id)
    setPlayerId(player.id)
    setIsJoining(false)
  }

  async function startGame() {
    setIsSubmitting(true)
    setIsGeneratingImages(true)
    setSubmitError(null)
    const response = await fetch('/api/rooms/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, sessionId: getSessionId() }),
    })
    if (!response.ok) {
      const body = (await response.json()) as { error?: string }
      setSubmitError(body.error ?? 'Failed to start game')
      setIsSubmitting(false)
      setIsGeneratingImages(false)
      return
    }
  }

  const submitStorytellerClue = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!playerId || !selectedCardId) return
    setSubmitError(null)
    const sanitizedClue = sanitizeDisplayText(clue, 200)
    const response = await fetch('/api/storytelling/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, storytellerId: playerId, cardId: selectedCardId, clue: sanitizedClue, sessionId: getSessionId() }),
    })
    if (!response.ok) {
      const body = (await response.json()) as { error?: string }
      setSubmitError(body.error ?? 'Failed to submit clue')
      return
    }
    setClue('')
    setSelectedCardId(null)
  }, [roomId, playerId, selectedCardId, clue])

  async function submitBluffCard() {
    if (!playerId || !selectedCardId) return
    setIsSubmitting(true)
    setSubmitError(null)
    const response = await fetch('/api/bluffing/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, playerId, cardId: selectedCardId, sessionId: getSessionId() }),
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
    if (!playerId || !selectedCardId) return
    setSubmitError(null)
    const response = await fetch('/api/voting/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, voterId: playerId, cardId: selectedCardId, sessionId: getSessionId() }),
    })
    if (!response.ok) {
      const body = (await response.json()) as { error?: string }
      setSubmitError(body.error ?? 'Failed to submit vote')
      setIsSubmitting(false)
      return
    }
    const body = (await response.json()) as { scored: boolean; deltas?: unknown }
    if (body.scored && body.deltas) {
      setScoreDeltas(body.deltas as ScoreDelta[])
    }
    setIsSubmitting(false)
  }

  async function nextRound() {
    setIsSubmitting(true)
    setIsGeneratingImages(true)
    setSubmitError(null)
    const response = await fetch('/api/rooms/next-round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, sessionId: getSessionId() }),
    })
    if (!response.ok) {
      const body = (await response.json()) as { error?: string }
      setSubmitError(body.error ?? 'Failed to start next round')
      setIsSubmitting(false)
      setIsGeneratingImages(false)
      return
    }
  }

  function copyRoomId() {
    void navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* ── Join screen ── */
  if (!playerId) {
    return (
      <main className="game-bg flex min-h-screen items-center justify-center px-6 py-10">
        <div className="glass-panel w-full max-w-sm p-8 text-center">
          <h1 className="mb-1 text-2xl font-bold tracking-[0.1em] text-[#c5a059] font-serif" style={{ fontVariant: 'small-caps' }}>Deep-Xit</h1>
          <p className="mb-6 text-sm text-[#e2e8f0]">Choose a display name to enter the room.</p>
          <form onSubmit={joinRoom} className="flex flex-col gap-3">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={30}
              autoFocus
              className="w-full rounded-lg border border-border bg-purple-deep/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <button className="btn-gold w-full" type="submit" disabled={isJoining || !displayName.trim()}>
              {isJoining ? 'Joining...' : 'Enter Game'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to home
            </button>
          </form>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="game-bg flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading game...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="game-bg flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel w-full max-w-sm p-8 text-center">
          <p className="text-destructive">{error}</p>
          <button className="btn-gold mt-4" onClick={() => router.push('/')}>Back to home</button>
        </div>
      </main>
    )
  }

  /* ── LOBBY ── */
  if (gameState.status === 'LOBBY') {
    return (
      <main className="game-bg flex min-h-screen items-center justify-center px-6 py-10">
        <div className="flex w-full max-w-lg flex-col items-center gap-8">
          <h1 className="text-4xl font-bold tracking-[0.15em] text-[#c5a059] font-serif" style={{ fontVariant: 'small-caps' }}>Deep-Xit</h1>

          <div className="glass-panel w-full p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold font-serif text-[#c5a059]">Waiting for players</h2>
              <button onClick={copyRoomId} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-gold/50 hover:text-gold">
                {copied ? 'Copied!' : 'Copy Room ID'}
              </button>
            </div>

            <div className="mb-5 space-y-1">
              {gameState.players.map((player, idx) => (
                <div key={player.id} className={`player-entry ${idx === 0 ? 'storyteller' : ''}`}>
                  <div className="player-avatar">{player.displayName.charAt(0).toUpperCase()}</div>
                  <span className="text-sm font-medium">{player.displayName}</span>
                  {player.id === playerId && <span className="ml-auto text-xs text-gold">(You)</span>}
                  {idx === 0 && <span className="ml-auto text-xs text-muted-foreground">Host</span>}
                </div>
              ))}
            </div>

            {submitError && <p className="mb-3 text-sm text-destructive">{submitError}</p>}

            <button className="btn-gold w-full" onClick={startGame} disabled={isSubmitting || gameState.players.length < 3 || gameState.players[0]?.id !== playerId}>
              {isSubmitting ? 'Starting...' : `Start Game (${gameState.players.length}/3+ players)`}
            </button>

            {showLoadingAnimation && (
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-2 border-gold/10" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-spin" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-gold/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  <div className="absolute inset-4 rounded-full border border-transparent border-t-gold/40 animate-spin" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-5 rounded-full bg-gold/10 animate-pulse" />
                </div>
                <p className="text-sm font-serif text-gold tracking-wider" style={{ fontVariant: 'small-caps' }}>Conjuring Visions</p>
                <p className="text-[11px] text-gold/50 italic">{loadingMessage}</p>
              </div>
            )}

          </div>
        </div>
      </main>
    )
  }

  /* ── ACTIVE GAME (Storytelling / Bluffing / Voting / Scoring) ── */

  const boardCards = submittedRoundCards

  const allVotesIn = gameState.status === 'VOTING' && gameState.votes.length >= gameState.players.length - 1

  const canSubmit =
    (gameState.status === 'STORYTELLING' && isStoryteller && selectedCardId && clue.trim()) ||
    (gameState.status === 'BLUFFING' && !isStoryteller && selectedCardId && !hasSubmittedBluff) ||
    (gameState.status === 'VOTING' && !isStoryteller && selectedCardId && !allVotesIn)

  const submitLabel =
    gameState.status === 'STORYTELLING' ? (isStoryteller ? 'Submit Clue' : '') :
    gameState.status === 'BLUFFING' ? 'Submit Card' :
    gameState.status === 'VOTING' ? 'Submit Vote' :
    gameState.status === 'SCORING' && gameState.currentRound < gameState.maxRounds ? 'Next Round' : ''

  async function handleMainAction(e?: FormEvent) {
    e?.preventDefault()
    if (gameState.status === 'STORYTELLING') {
      setIsSubmitting(true)
      await submitStorytellerClue(e as FormEvent<HTMLFormElement>)
      setIsSubmitting(false)
    } else if (gameState.status === 'BLUFFING') {
      await submitBluffCard()
    } else if (gameState.status === 'VOTING') {
      setIsSubmitting(true)
      await submitVote()
      setSelectedCardId(null)
    } else if (gameState.status === 'SCORING') {
      await nextRound()
    }
  }

  const handCards = gameState.status === 'BLUFFING' && !isStoryteller
    ? playerHand.filter((c) => !c.isStorytellerCard)
    : playerHand

  const statusText =
    gameState.status === 'STORYTELLING' ? (isStoryteller ? 'Pick a card and give a clue' : `Waiting for ${storytellerName}...`) :
    gameState.status === 'BLUFFING' ? (isStoryteller ? `Waiting for bluffs (${submittedRoundCards.length - 1}/${gameState.players.length - 1})` : hasSubmittedBluff ? `Bluff submitted! Waiting... (${submittedRoundCards.length - 1}/${gameState.players.length - 1})` : 'Pick a card that matches the clue') :
    gameState.status === 'VOTING' ? (isStoryteller ? 'Storyteller does not vote' : allVotesIn ? 'All votes in! Waiting for scoring...' : currentPlayerVote ? 'Vote recorded! You can change it until all votes are in.' : 'Pick the storyteller\'s card') :
    gameState.status === 'SCORING' ? '' :
    gameState.status === 'FINISHED' ? 'Game Over!' : ''

  const winner = gameState.status === 'FINISHED' ? gameState.players.reduce((prev, current) => (prev.score > current.score ? prev : current)) : null

  return (
    <main className={`h-screen bg-[#0a0612] flex flex-col ${gameState.status === 'SCORING' ? 'overflow-y-auto' : 'overflow-hidden'}`}>
      {/* Celestial loading overlay */}
      <AnimatePresence>
        {showLoadingAnimation && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0612]/96 backdrop-blur-md"
          >
            <div className="flex flex-col items-center gap-7">
              {/* Gold Moon orb */}
              <div className="relative w-28 h-28">
                {/* Outer atmospheric glow */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(197,160,89,0.18) 0%, transparent 70%)' }}
                  animate={{ scale: [0.85, 1.25, 0.85], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Ring 1 — slow outer */}
                <div className="absolute inset-0 rounded-full border border-[rgba(197,160,89,0.18)] animate-spin" style={{ animationDuration: '8s' }} />
                {/* Ring 2 — medium */}
                <div className="absolute inset-2 rounded-full border border-[rgba(197,160,89,0.35)] animate-spin" style={{ animationDuration: '3s' }} />
                {/* Ring 3 — fast reverse */}
                <div className="absolute inset-4 rounded-full border border-transparent border-t-[rgba(212,175,90,0.7)] animate-spin" style={{ animationDuration: '1.6s', animationDirection: 'reverse' }} />
                {/* Inner ring */}
                <div className="absolute inset-6 rounded-full border border-transparent border-b-[rgba(197,160,89,0.5)] animate-spin" style={{ animationDuration: '2.4s' }} />
                {/* Moon center */}
                <motion.div
                  className="loading-orb absolute inset-8 rounded-full flex items-center justify-center"
                  style={{ background: 'radial-gradient(circle, rgba(212,175,90,0.55) 0%, rgba(197,160,89,0.2) 60%, transparent 100%)' }}
                >
                  <span className="text-[#d4af5a] text-lg leading-none select-none" style={{ textShadow: '0 0 12px rgba(212,175,90,0.8)' }}>☽</span>
                </motion.div>
              </div>

              {/* Text block */}
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="font-['Cinzel'] text-base font-semibold uppercase tracking-[0.2em] text-[#d4af5a]" style={{ textShadow: '0 0 16px rgba(197,160,89,0.5)' }}>
                  Conjuring Visions
                </p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingMessage}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.5 }}
                    className="text-[11px] italic text-[#c5a059]/55 max-w-[220px]"
                  >
                    {loadingMessage}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Environmental elements */}
      <div className="environment-bg">
        <div className="clockwork-tree" />
        <div className="floating-castle" />
      </div>

      {/* ── Sticky header (h-16) ── */}
      <div className="sticky top-0 z-50 h-16 border-b border-gold/20 bg-[#0a0612]/90 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-[#c5a059] hover:text-[#e0c872] transition-colors"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(197, 160, 89, 0.3))' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <h1 className="text-xl font-bold tracking-[0.15em] text-[#c5a059] font-serif" style={{ fontVariant: 'small-caps' }}>
              Deep-Xit
            </h1>
          </div>
          {gameState.status && gameState.status !== 'FINISHED' && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#c5a059] font-serif">Round {gameState.currentRound} / {gameState.maxRounds}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={copyRoomId}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Copy Room ID
            </button>
          </div>
        </div>
      </div>

      {/* ── Main game area (flexbox skeleton: header, main stage, action tray) ── */}
      <div className={`flex flex-col flex-1 max-w-4xl mx-auto w-full px-4 lg:px-6 relative ${gameState.status === 'SCORING' ? 'overflow-y-auto' : ''}`}>
        {/* Clue banner - fixed at top, separate from circle */}
        {gameState.currentClue && gameState.status !== 'FINISHED' && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl">
            <div className="clue-banner px-6 py-3 text-center">
              <p className="text-lg font-medium italic text-foreground">&ldquo;{sanitizeDisplayText(gameState.currentClue, 500)}&rdquo;</p>
            </div>
          </div>
        )}

        {/* Main Stage (expanding) */}
        <div className={`flex flex-1 flex-col gap-3 relative ${gameState.status === 'SCORING' ? 'pt-16' : 'pt-24'}`}>
          {/* Storytelling clue input - positioned above cards */}
          {gameState.status === 'STORYTELLING' && isStoryteller && (
            <div className="z-10">
              <form onSubmit={handleMainAction} className="flex gap-2">
                <input
                  value={clue}
                  onChange={(e) => setClue(e.target.value)}
                  placeholder="Type your clue..."
                  maxLength={140}
                  className="flex-1 rounded-lg border border-border bg-purple-deep/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
              </form>
            </div>
          )}

          {/* Scoring cards - no circle */}
          {gameState.status === 'SCORING' && (
            <div className="flex flex-col items-center gap-4 w-full py-4">
              {(() => {
                const storytellerCard = boardCards.find((c) => c.isStorytellerCard)
                const owner = gameState.players.find((p) => p.id === storytellerCard?.playerId)
                const voteCount = gameState.votes.filter((v) => v.cardId === storytellerCard?.id).length
                const otherCards = boardCards.filter((c) => !c.isStorytellerCard)
                return (
                  <>
                    {storytellerCard && (
                      <div className="relative w-48 h-64 sm:w-56 sm:h-72 lg:w-64 lg:h-80 rounded-xl overflow-hidden border-4 border-gold shadow-[0_0_40px_rgba(212,175,55,0.6)]">
                        <img src={storytellerCard.imageUrl} alt="Storyteller's card" className="w-full h-full object-cover" />
                        {!storytellerCard.imageUrl && <div className="absolute inset-0 bg-purple-deep/50 flex items-center justify-center text-sm text-muted-foreground">No image URL</div>}
                        <div className="absolute bottom-0 left-0 right-0 bg-purple-deep/90 px-4 py-3" style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-sm lg:text-lg">{owner?.displayName ?? '?'}</span>
                            <span className="font-bold text-white text-sm lg:text-lg">{voteCount} votes</span>
                          </div>
                          <div className="mt-1 text-xs lg:text-sm font-bold text-gold">STORYTELLER'S CARD</div>
                        </div>
                      </div>
                    )}
                    {otherCards.length > 0 && (
                      <div className="flex gap-3 justify-center flex-wrap px-4">
                        {otherCards.map((card) => {
                          const cardOwner = gameState.players.find((p) => p.id === card.playerId)
                          const cardVoteCount = gameState.votes.filter((v) => v.cardId === card.id).length
                          return (
                            <div key={card.id} className="flex-shrink-0 relative w-20 h-28 sm:w-24 sm:h-32 lg:w-28 lg:h-36 rounded-xl overflow-hidden border-2 border-gold/50 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                              <img src={card.imageUrl} alt="Card" className="w-full h-full object-cover" />
                              {!card.imageUrl && <div className="absolute inset-0 bg-purple-deep/50 flex items-center justify-center text-xs text-muted-foreground">No image URL</div>}
                              <div className="absolute bottom-0 left-0 right-0 bg-purple-deep/90 px-2 py-1" style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                                <span className="truncate font-bold text-white text-[10px] block">{cardOwner?.displayName ?? '?'}</span>
                                <span className="font-bold text-gold text-[10px]">{cardVoteCount} votes</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}

          {/* Board area with submitted cards - circular table (non-scoring phases) */}
          {gameState.status !== 'FINISHED' && gameState.status !== 'SCORING' && (
          <div className="flex items-center justify-center p-6 relative mx-auto flex-1 flex-shrink min-h-[200px] max-h-[40vh] aspect-square">
            <div className="game-table relative w-full max-w-2xl z-10 aspect-square">
              <div className="circle-cards absolute inset-0 flex items-center justify-center">
                {/* ── Zoomed selected card display (centered in circle) ── */}
                {selectedCardId && (gameState.status === 'STORYTELLING' || gameState.status === 'BLUFFING') && (
                  <div className="z-20">
                    {(() => {
                      const selectedCard = handCards.find((card) => card.id === selectedCardId)
                      return selectedCard ? (
                        <div className="relative w-32 h-44 sm:w-40 sm:h-56 rounded-xl overflow-hidden border-2 border-gold/50 shadow-[0_0_24px_rgba(201,168,76,0.5)]">
                          <img src={selectedCard.imageUrl} alt="Selected card" className="w-full h-full object-cover" />
                        </div>
                      ) : null
                    })()}
                  </div>
                )}

                <>
                  {boardCards.length === 0 && gameState.status !== 'BLUFFING' && gameState.status !== 'STORYTELLING' ? (
                    <p className="text-sm text-[#e2e8f0]">No cards on the board yet</p>
                  ) : (gameState.status === 'STORYTELLING' || gameState.status === 'BLUFFING') ? (
                  /* Face-down cards in circular formation with dynamic slots */
                  <>
                    {(() => {
                      const cardCount = submittedRoundCards.length
                      const slotCount = cardCount > 0 ? cardCount : 6
                      const radius = 35
                      const slots = Array.from({ length: slotCount }, (_, i) => {
                        const angle = (i / slotCount) * 360
                        const x = 50 + radius * Math.cos((angle - 90) * Math.PI / 180)
                        const y = 50 + radius * Math.sin((angle - 90) * Math.PI / 180)
                        return { index: i, angle, x, y }
                      })

                      // Storyteller card always goes to top-center (slot 0, angle 0)
                      const storytellerCard = submittedRoundCards.find((c) => c.isStorytellerCard)
                      const bluffCards = submittedRoundCards.filter((c) => !c.isStorytellerCard)

                      return (
                        <>
                          {/* Storyteller card in top-center slot */}
                          {storytellerCard && (
                            <div key={storytellerCard.id} className="circle-card" style={{ left: `${slots[0].x}%`, top: `${slots[0].y}%`, transform: 'translate(-50%, -50%)' }}>
                              <div className="game-card w-20 sm:w-24 lg:w-28">
                                <div className="card-back-moon" />
                              </div>
                            </div>
                          )}
                          
                          {/* Bluff cards fill remaining slots clockwise */}
                          {bluffCards.map((card, idx) => {
                            const slotIndex = (idx + 1) % slotCount
                            const slot = slots[slotIndex]
                            return (
                              <div key={card.id} className="circle-card" style={{ left: `${slot.x}%`, top: `${slot.y}%`, transform: 'translate(-50%, -50%)' }}>
                                <div className="game-card w-20 sm:w-24 lg:w-28">
                                  <div className="card-back-moon" />
                                </div>
                              </div>
                            )
                          })}
                        </>
                      )
                    })()}
                  </>
                ) : (
                  /* Face-up cards in circular formation */
                  <>
                    {(() => {
                      // Normal circular formation for other phases - make larger for voting
                      const cardCount = boardCards.length
                      const slotCount = cardCount > 0 ? cardCount : 6
                      // Use larger radius (45%) for voting phase to cover more screen
                      const radius = gameState.status === 'VOTING' ? 45 : 35
                      // Dynamically adjust card size based on number of cards
                      const getCardSize = () => {
                        if (cardCount <= 6) return 'w-20 h-[106px] sm:w-24 sm:h-[128px] lg:w-28 lg:h-[149px]'
                        if (cardCount <= 10) return 'w-16 h-20 sm:w-20 sm:h-24 lg:w-24 lg:h-28'
                        return 'w-14 h-18 sm:w-18 sm:h-22 lg:w-20 lg:h-26'
                      }
                      const cardSizeClass = getCardSize()
                      const slots = Array.from({ length: slotCount }, (_, i) => {
                        const angle = (i / slotCount) * 360
                        const x = 50 + radius * Math.cos((angle - 90) * Math.PI / 180)
                        const y = 50 + radius * Math.sin((angle - 90) * Math.PI / 180)
                        return { index: i, angle, x, y }
                      })

                      return (
                        <>
                          {boardCards.map((card, idx) => {
                            const owner = gameState.players.find((p) => p.id === card.playerId)
                            const voteCount = gameState.votes.filter((v) => v.cardId === card.id).length
                            const isVotable = gameState.status === 'VOTING' && !isStoryteller && card.playerId !== playerId && !allVotesIn
                            const isVotedByPlayer = currentPlayerVote?.cardId === card.id
                            const slot = slots[idx % slotCount]
                            return (
                              <div
                                key={card.id}
                                className="circle-card"
                                style={{ left: `${slot.x}%`, top: `${slot.y}%`, transform: 'translate(-50%, -50%)' }}
                              >
                                <div className="relative">
                                  <button
                                    type="button"
                                    disabled={!isVotable}
                                    onClick={() => isVotable && setSelectedCardId(card.id)}
                                    className={`game-card flex-shrink-0 relative transition-all duration-200 ${cardSizeClass} ${selectedCardId === card.id ? 'border-12 border-gold shadow-[0_0_70px_rgba(212,175,55,1)] scale-125 z-10 animate-pulse' : ''} ${card.isStorytellerCard && gameState.status === 'SCORING' ? 'ring-4 ring-gold ring-offset-2 ring-offset-purple-deep' : ''}`}
                                  >
                                    <img 
                                      src={card.imageUrl} 
                                      alt="Board card" 
                                      className="w-full h-full object-cover"
                                    />
                                    {!card.imageUrl && <div className="absolute inset-0 bg-purple-deep/50 flex items-center justify-center text-xs text-muted-foreground">No image URL</div>}
                                    {isVotedByPlayer && gameState.status === 'VOTING' && (
                                      <div className="absolute top-2 right-2 bg-gold text-purple-deep rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                      </div>
                                    )}
                                    {gameState.status === 'SCORING' && (
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-3 py-4" style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-white text-lg">{owner?.displayName ?? '?'}</span>
                                          <div className="flex items-center gap-2">
                                            {card.isStorytellerCard && <span className="bg-gold text-purple-deep px-2 py-1 rounded text-sm font-bold">ST</span>}
                                            <span className="text-white font-bold text-lg">{voteCount}v</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </>
                      )
                    })()}
                  </>
                )}
                </>
              </div>
            </div>
          </div>
          )}
          </div>
      </div>

      {/* Status text - below the circle board */}
      {gameState.status !== 'FINISHED' && <p className="text-center text-sm text-muted-foreground z-30 mb-2">{statusText}</p>}

      {/* Winner display when game is finished */}
      {gameState.status === 'FINISHED' && winner && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4 z-30">
          <div className="glass-panel p-6 text-center flex flex-col items-center">
            <p className="mb-2 text-xs font-semibold text-gold italic">{getWinnerSarcasticMessage(winner)}</p>
            <h2 className="text-2xl font-bold text-gold mb-4" style={{ fontVariant: 'small-caps' }}>🏆 Game Over! 🏆</h2>
            
            {/* Winner highlight */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="relative">
                <div className="player-avatar w-20 h-20 text-3xl">{winner.displayName.charAt(0).toUpperCase()}</div>
                <div className="absolute -top-3 -right-3 text-2xl">
                  {winner.id === gameState.players[0]?.id ? <span className="text-gold font-bold text-sm">(Host)</span> : <span>👑</span>}
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{winner.displayName}</p>
                <p className="text-2xl font-bold text-gold">{winner.score} points</p>
              </div>
              {winner.id === playerId && <p className="text-sm text-muted-foreground italic">You won!</p>}
            </div>

            {/* All players leaderboard */}
            <div className="w-full border-t border-gold/20 pt-4">
              <p className="text-sm font-semibold text-gold mb-3">Final Scores</p>
              <div className="flex flex-col gap-2">
                {[...gameState.players].sort((a, b) => b.score - a.score).map((player, idx) => {
                  const isHost = player.id === gameState.players[0]?.id
                  return (
                    <div key={player.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${player.id === winner.id ? 'border-gold bg-gold/10' : 'border-border'}`}>
                      <span className="text-sm font-bold text-gold w-6">{idx + 1}</span>
                      <div className="player-avatar text-xs">{player.displayName.charAt(0).toUpperCase()}</div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-medium text-white">{player.displayName}{isHost && <span className="text-gold ml-1">👑</span>}</p>
                      </div>
                      <p className="text-sm font-bold text-gold">{player.score}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom stack (vertical hierarchy: Hand, Submit Button) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex flex-col bg-purple-deep/95 backdrop-blur-sm border-t border-gold/20">
        {/* Player Hand (scaled cards on narrow screens) */}
        {(gameState.status === 'STORYTELLING' ||
          (gameState.status === 'BLUFFING' && !isStoryteller && !hasSubmittedBluff)) && (
          <div className="flex flex-row justify-center items-center overflow-x-auto gap-3 px-4 py-3">
            {handCards.map((card) => {
              const isDisabled =
                (gameState.status === 'BLUFFING' && (isStoryteller || card.isSubmittedForRound || hasSubmittedBluff)) ||
                (gameState.status === 'VOTING')

              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setSelectedCardId(selectedCardId === card.id ? null : card.id)}
                  className={`game-card flex-shrink-0 w-14 h-20 sm:w-16 sm:h-24 ${selectedCardId === card.id ? 'border-2 border-gold shadow-[0_0_20px_rgba(212,175,55,0.6)]' : ''} hover:scale-105 transition-all duration-200`}
                >
                  <img src={card.imageUrl} alt="Hand card" className="aspect-[3/4] w-full h-full object-cover rounded-lg" />
                </button>
              )
            })}
            {handCards.length === 0 && <p className="py-2 text-xs text-muted-foreground">No cards</p>}
          </div>
        )}

        {/* Submit Button (always visible at bottom with z-index-[60]) */}
        {submitLabel && gameState.status !== 'SCORING' && !(gameState.status === 'VOTING' && allVotesIn) && (
          <div className="px-4 py-3 mb-4 z-[60]">
            <button
              className={`btn-gold shadow-[0_0_15px_rgba(212,175,55,0.4)] w-[90%] mx-auto py-3 ${selectedCardId ? 'brightness-110 shadow-[0_0_25px_rgba(212,175,55,0.6)]' : ''}`}
              onClick={handleMainAction}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : submitLabel}
            </button>
          </div>
        )}
      </div>

      {/* ── Voting submit button (separate from hand tray) ── */}
      {gameState.status === 'VOTING' && !isStoryteller && !currentPlayerVote && !isSubmitting && submitLabel && (
        <div className="hidden lg:flex fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <button
            className={`btn-gold shadow-[0_0_15px_rgba(212,175,55,0.4)] px-8 py-2 ${selectedCardId ? 'brightness-110 shadow-[0_0_25px_rgba(212,175,55,0.6)]' : ''}`}
            onClick={handleMainAction}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : submitLabel}
          </button>
        </div>
      )}

      {/* ── Bottom hand tray (dedicated footer container - widescreen) ── */}
      {(gameState.status === 'STORYTELLING' ||
        (gameState.status === 'BLUFFING' && !isStoryteller && !hasSubmittedBluff)) && (
        <div className="hidden lg:flex fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-6 gap-4 p-4 bg-purple-deep/90 backdrop-blur-sm">
          {/* Cards row */}
          <div className="flex flex-row justify-center items-center overflow-visible gap-4 px-2 h-40">
            {handCards.map((card) => {
              const isDisabled =
                (gameState.status === 'BLUFFING' && (isStoryteller || card.isSubmittedForRound || hasSubmittedBluff)) ||
                (gameState.status === 'VOTING')

              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setSelectedCardId(selectedCardId === card.id ? null : card.id)}
                  className={`game-card flex-shrink-0 w-20 h-28 lg:w-24 lg:h-32 ${selectedCardId === card.id ? 'border-2 border-gold shadow-[0_0_20px_rgba(212,175,55,0.6)]' : ''} hover:scale-105 hover:-translate-y-4 transition-all duration-200`}
                >
                  <img src={card.imageUrl} alt="Hand card" className="aspect-[3/4] w-full h-full object-cover rounded-lg" />
                </button>
              )
            })}
            {handCards.length === 0 && <p className="py-4 text-sm text-muted-foreground">No cards in hand</p>}
          </div>
          
          {/* Submit button row - centered at very bottom */}
          {submitLabel && (
            <div className="flex justify-center">
              <button
                className={`btn-gold shadow-[0_0_15px_rgba(212,175,55,0.4)] px-8 py-2 z-[60] ${selectedCardId ? 'brightness-110 shadow-[0_0_25px_rgba(212,175,55,0.6)]' : ''}`}
                onClick={handleMainAction}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : submitLabel}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Next round button (bottom-6 right-6 during scoring) - only host can click */}
      {gameState.status === 'SCORING' && gameState.currentRound < gameState.maxRounds && gameState.players[0]?.id === playerId && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            className="btn-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]"
            onClick={nextRound}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Starting...' : 'Next Round'}
          </button>
        </div>
      )}

      {/* ── Scoring overlay (shown instead of hand) ── */}
      {gameState.status === 'SCORING' && (
        <div className="hand-tray px-4 py-4 sm:px-6 pb-20 lg:pb-4 mt-20 lg:mt-0">
          <p className="mb-2 text-xs font-semibold text-gold">{lastSarcasticMessage || getCynicalRoundMessage(gameState, gameState.votes, gameState.cards)}</p>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pb-1">
            {[...gameState.players].sort((a, b) => b.score - a.score).map((player, idx) => {
              const scoreDelta = scoreDeltas.find((d) => d.playerId === player.id)?.points ?? 0
              const isHost = player.id === gameState.players[0]?.id
              return (
                <div key={player.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isHost ? 'border-gold bg-gold/10' : 'border-border'}`}>
                  <span className="text-sm font-bold text-gold">{idx + 1}</span>
                  <div className="player-avatar text-xs">{player.displayName.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="text-xs font-medium">{player.displayName}{isHost && <span className="text-gold ml-1">👑</span>}</p>
                    <p className="text-xs text-muted-foreground">{player.score} pts{scoreDelta > 0 && <span className="text-gold ml-1">+{scoreDelta}</span>}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}

/* getCynicalRoundMessage and getWinnerSarcasticMessage moved to lib/game/round-messages.ts */
