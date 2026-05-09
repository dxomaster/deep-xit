import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  const contents = readFileSync(envPath, 'utf8')

  for (const line of contents.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex)
    const rawValue = trimmed.slice(separatorIndex + 1)
    const value = rawValue.replace(/^['"]|['"]$/g, '')

    process.env[key] = value
  }
}

loadEnvLocal()

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or service role key in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const PLACEHOLDER_IMAGES = [
  'https://picsum.photos/seed/dixit1/512/512',
  'https://picsum.photos/seed/dixit2/512/512',
  'https://picsum.photos/seed/dixit3/512/512',
  'https://picsum.photos/seed/dixit4/512/512',
  'https://picsum.photos/seed/dixit5/512/512',
  'https://picsum.photos/seed/dixit6/512/512',
  'https://picsum.photos/seed/dixit7/512/512',
  'https://picsum.photos/seed/dixit8/512/512',
  'https://picsum.photos/seed/dixit9/512/512',
  'https://picsum.photos/seed/dixit10/512/512',
  'https://picsum.photos/seed/dixit11/512/512',
  'https://picsum.photos/seed/dixit12/512/512',
  'https://picsum.photos/seed/dixit13/512/512',
  'https://picsum.photos/seed/dixit14/512/512',
  'https://picsum.photos/seed/dixit15/512/512',
  'https://picsum.photos/seed/dixit16/512/512',
  'https://picsum.photos/seed/dixit17/512/512',
  'https://picsum.photos/seed/dixit18/512/512',
]

async function seed() {
  console.log('Creating room...')

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({ status: 'LOBBY' })
    .select()
    .single()

  if (roomError) {
    throw new Error(`Failed to create room: ${roomError.message}`)
  }

  console.log(`Room: ${room.id}`)

  const playerNames = ['Alice (Storyteller)', 'Bob', 'Charlie']
  const players = []

  for (let i = 0; i < playerNames.length; i++) {
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        room_id: room.id,
        display_name: playerNames[i],
        session_id: `test-session-${i}`,
      })
      .select()
      .single()

    if (playerError) {
      throw new Error(`Failed to create player ${playerNames[i]}: ${playerError.message}`)
    }

    players.push(player)
    console.log(`Player: ${player.display_name} → ${player.id}`)
  }

  const storyteller = players[0]

  const { error: storytellerError } = await supabase
    .from('rooms')
    .update({ storyteller_id: storyteller.id, status: 'STORYTELLING' })
    .eq('id', room.id)

  if (storytellerError) {
    throw new Error(`Failed to set storyteller: ${storytellerError.message}`)
  }

  console.log(`\nStoryteller set to: ${storyteller.display_name}`)

  let imageIndex = 0

  for (const player of players) {
    const cardInserts = []

    for (let c = 0; c < 6; c++) {
      cardInserts.push({
        room_id: room.id,
        player_id: player.id,
        image_url: PLACEHOLDER_IMAGES[imageIndex % PLACEHOLDER_IMAGES.length],
      })

      imageIndex++
    }

    const { error: cardsError } = await supabase.from('cards').insert(cardInserts)

    if (cardsError) {
      throw new Error(`Failed to create cards for ${player.display_name}: ${cardsError.message}`)
    }

    console.log(`Created 6 cards for ${player.display_name}`)
  }

  console.log('\n=== TEST GAME READY ===')
  console.log(`Room ID:        ${room.id}`)
  console.log(`Status:         STORYTELLING`)
  console.log(`Storyteller:    ${storyteller.display_name} (${storyteller.id})`)

  for (const player of players) {
    console.log(`Player:         ${player.display_name} → ${player.id}`)
  }

  console.log('\nPaste the Room ID and a Player ID into the web UI to test.')
  console.log('Start as the storyteller: pick a card, type a clue, submit.')
  console.log('Then switch to another player ID to bluff and vote.')
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
