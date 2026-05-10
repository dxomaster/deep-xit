import type { GeneratedImage, GenerateImagesCommand } from '@/lib/game/types'
import type { SupabaseClient } from '@supabase/supabase-js'

interface TogetherImageResponse {
  data?: Array<{
    url?: string
    b64_json?: string
  }>
}

export class TogetherImageService {
  private readonly endpoint = 'https://api.together.xyz/v1/images/generations'
  private readonly model = 'black-forest-labs/FLUX.1-schnell'

  constructor(
    private readonly supabase?: SupabaseClient,
  ) {}

  async generateDixitImages(command: GenerateImagesCommand): Promise<GeneratedImage[]> {
    const count = command.count ?? 6
    let theme = command.theme.trim()

    if (count <= 0 || count > 12) {
      throw new Error('Image generation count must be between 1 and 12')
    }

    if (!theme) {
      throw new Error('Image generation theme cannot be empty')
    }

    // Large list of random words to add diversity
    const randomWords = [
      'whisper', 'echo', 'shadow', 'light', 'dream', 'memory', 'secret', 'journey', 'wonder', 'mystery',
      'adventure', 'magic', 'spirit', 'nature', 'cosmic', 'ethereal', 'ancient', 'forgotten', 'hidden', 'eternal',
      'infinite', 'celestial', 'mystical', 'enchantment', 'illusion', 'fantasy', 'legend', 'myth', 'fable', 'tale',
      'song', 'melody', 'harmony', 'rhythm', 'dance', 'movement', 'flow', 'energy', 'vibration', 'resonance',
      'crystal', 'gemstone', 'diamond', 'emerald', 'sapphire', 'ruby', 'amethyst', 'topaz', 'opal', 'pearl',
      'ocean', 'sea', 'river', 'lake', 'stream', 'waterfall', 'wave', 'tide', 'current', 'depth',
      'mountain', 'peak', 'valley', 'canyon', 'cliff', 'cave', 'forest', 'grove', 'meadow', 'garden',
      'sky', 'cloud', 'star', 'moon', 'sun', 'dawn', 'dusk', 'twilight', 'night', 'day',
      'fire', 'flame', 'spark', 'ember', 'blaze', 'inferno', 'ice', 'frost', 'snow', 'winter',
      'spring', 'summer', 'autumn', 'fall', 'season', 'harvest', 'bloom', 'blossom', 'flower', 'petal',
      'leaf', 'branch', 'tree', 'root', 'seed', 'fruit', 'grain', 'wheat', 'corn', 'field',
      'bird', 'wing', 'feather', 'flight', 'nest', 'eagle', 'hawk', 'owl', 'swan', 'phoenix',
      'wolf', 'fox', 'deer', 'bear', 'lion', 'tiger', 'elephant', 'whale', 'dolphin', 'butterfly',
      'dragon', 'unicorn', 'mermaid', 'fairy', 'elf', 'giant', 'dwarf', 'angel', 'demon', 'spirit',
      'portal', 'gateway', 'door', 'key', 'lock', 'treasure', 'chest', 'map', 'compass', 'scroll',
      'book', 'page', 'ink', 'quill', 'parchment', 'library', 'archive', 'knowledge', 'wisdom', 'truth',
      'mirror', 'reflection', 'glass', 'window', 'frame', 'portrait', 'image', 'vision', 'sight', 'view',
      'clock', 'time', 'hour', 'minute', 'second', 'moment', 'instant', 'era', 'age', 'epoch',
      'bridge', 'path', 'road', 'way', 'journey', 'quest', 'mission', 'purpose', 'destiny', 'fate',
      'heart', 'soul', 'mind', 'spirit', 'essence', 'core', 'center', 'source', 'origin', 'beginning',
      'end', 'finish', 'conclusion', 'result', 'outcome', 'destiny', 'future', 'past', 'present', 'now',
      'circle', 'sphere', 'orb', 'ring', 'spiral', 'helix', 'curve', 'arc', 'bend', 'turn',
      'triangle', 'pyramid', 'cone', 'square', 'cube', 'rectangle', 'diamond', 'hexagon', 'octagon', 'star',
      'web', 'net', 'mesh', 'grid', 'lattice', 'pattern', 'design', 'structure', 'form', 'shape',
      'color', 'hue', 'shade', 'tint', 'tone', 'spectrum', 'rainbow', 'prism', 'light', 'dark',
      'sound', 'noise', 'silence', 'quiet', 'voice', 'speech', 'word', 'language', 'meaning', 'thought',
      'emotion', 'feeling', 'passion', 'desire', 'love', 'hate', 'joy', 'sorrow', 'hope', 'fear',
      'courage', 'strength', 'power', 'might', 'force', 'energy', 'vitality', 'life', 'death', 'rebirth',
      'transformation', 'change', 'evolution', 'growth', 'decay', 'destruction', 'creation', 'birth', 'rise', 'fall',
      'balance', 'harmony', 'order', 'chaos', 'peace', 'war', 'conflict', 'resolution', 'unity', 'division',
      'connection', 'bond', 'link', 'tie', 'chain', 'rope', 'bridge', 'path', 'way', 'relation',
      'isolation', 'solitude', 'loneliness', 'silence', 'quiet', 'stillness', 'calm', 'rest', 'sleep', 'dream',
      'awakening', 'enlightenment', 'awareness', 'consciousness', 'mindfulness', 'presence', 'attention', 'focus', 'concentration', 'meditation',
      'creativity', 'imagination', 'inspiration', 'innovation', 'invention', 'discovery', 'exploration', 'adventure', 'journey', 'quest',
      'art', 'music', 'poetry', 'literature', 'dance', 'theater', 'film', 'photography', 'sculpture', 'architecture',
      'science', 'technology', 'mathematics', 'physics', 'chemistry', 'biology', 'astronomy', 'cosmology', 'quantum', 'relativity',
      'philosophy', 'religion', 'spirituality', 'mysticism', 'occult', 'magic', 'ritual', 'ceremony', 'tradition', 'custom',
      'culture', 'society', 'civilization', 'history', 'archaeology', 'anthropology', 'sociology', 'psychology', 'humanity', 'mankind',
      'universe', 'galaxy', 'star', 'planet', 'moon', 'sun', 'solar', 'lunar', 'stellar', 'cosmic',
      'atom', 'molecule', 'particle', 'wave', 'field', 'force', 'energy', 'matter', 'antimatter', 'dark matter',
      'dimension', 'reality', 'existence', 'being', 'non-being', 'void', 'nothingness', 'emptiness', 'fullness', 'completeness',
      'infinite', 'finite', 'eternal', 'temporary', 'permanent', 'transient', 'ephemeral', 'lasting', 'enduring', 'fleeting',
      'beauty', 'ugliness', 'truth', 'falsehood', 'reality', 'illusion', 'authenticity', 'artificiality', 'genuine', 'fake',
      'strength', 'weakness', 'power', 'powerlessness', 'control', 'surrender', 'dominance', 'submission', 'authority', 'freedom',
      'bond', 'separation', 'unity', 'division', 'together', 'apart', 'connected', 'disconnected', 'related', 'unrelated',
      'beginning', 'middle', 'end', 'start', 'finish', 'alpha', 'omega', 'first', 'last', 'between',
      'above', 'below', 'high', 'low', 'up', 'down', 'top', 'bottom', 'peak', 'valley',
      'inside', 'outside', 'inner', 'outer', 'internal', 'external', 'within', 'without', 'contained', 'uncontained',
      'forward', 'backward', 'ahead', 'behind', 'before', 'after', 'past', 'future', 'now', 'then',
      'left', 'right', 'center', 'side', 'edge', 'border', 'boundary', 'limit', 'threshold', 'horizon',
      'fast', 'slow', 'quick', 'rapid', 'swift', 'speed', 'velocity', 'momentum', 'movement', 'motion',
      'hot', 'cold', 'warm', 'cool', 'temperature', 'heat', 'chill', 'freeze', 'melt', 'boil',
      'wet', 'dry', 'moist', 'damp', 'soaked', 'drenched', 'arid', 'parched', 'thirsty', 'quenched',
      'hard', 'soft', 'rough', 'smooth', 'texture', 'surface', 'feel', 'touch', 'sensation', 'perception',
      'bright', 'dark', 'light', 'dim', 'shiny', 'dull', 'glowing', 'fading', 'radiant', 'shadowed',
      'loud', 'quiet', 'noise', 'silence', 'sound', 'mute', 'deafening', 'whisper', 'shout', 'scream',
      'sweet', 'sour', 'bitter', 'salty', 'taste', 'flavor', 'delicious', 'disgusting', 'palatable', 'repulsive',
      'fragrant', 'odorous', 'scent', 'smell', 'aroma', 'perfume', 'stink', 'fresh', 'stale', 'rotten',
      'clean', 'dirty', 'pure', 'corrupted', 'stained', 'spotless', 'filthy', 'tidy', 'messy', 'organized',
      'rich', 'poor', 'wealthy', 'impoverished', 'abundant', 'scarce', 'plentiful', 'rare', 'common', 'unique',
      'young', 'old', 'ancient', 'modern', 'new', 'aged', 'fresh', 'stale', 'immature', 'mature',
      'big', 'small', 'large', 'tiny', 'huge', 'miniature', 'giant', 'dwarf', 'massive', 'microscopic',
      'heavy', 'light', 'weight', 'mass', 'dense', 'sparse', 'thick', 'thin', 'solid', 'fluid',
      'sharp', 'blunt', 'pointed', 'rounded', 'edge', 'corner', 'tip', 'base', 'center', 'surface'
    ]

    // Add 1-2 random words to the theme
    const numRandomWords = Math.floor(Math.random() * 2) + 1 // 1 or 2 words
    for (let i = 0; i < numRandomWords; i++) {
      const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)]
      theme = `${theme} ${randomWord}`
    }

    const lenses = [
      {
        name: 'Literal-Surreal',
        metaphor: `a physical object doing something impossible`,
        vibe: 'dramatic',
        colorPalette: 'saturated, high contrast'
      },
      {
        name: 'Micro-Macro',
        metaphor: `seen through a microscope or as a vast galaxy`,
        vibe: 'ethereal',
        colorPalette: 'soft, pastel, iridescent'
      },
      {
        name: 'Transformation',
        metaphor: `gradually turning into something unexpected`,
        vibe: 'magical',
        colorPalette: 'warm, golden, amber tones'
      },
      {
        name: 'Character',
        metaphor: `embodied as a mystical creature or person`,
        vibe: 'whimsical',
        colorPalette: 'vibrant, playful, multicolored'
      },
      {
        name: 'Architecture',
        metaphor: `as a fantastical building or landscape`,
        vibe: 'grand',
        colorPalette: 'deep blues, purples, starlight'
      },
      {
        name: 'Abstract-Emotional',
        metaphor: `as symbolic shapes, shadows, and emotions`,
        vibe: 'mysterious',
        colorPalette: 'muted, earth tones, soft gradients'
      },
      {
        name: 'Time-Shift',
        metaphor: `in a different time era or dimension`,
        vibe: 'nostalgic',
        colorPalette: 'sepia, vintage, warm tones'
      },
      {
        name: 'Nature-Fusion',
        metaphor: `merged with elements of nature and wildlife`,
        vibe: 'organic',
        colorPalette: 'greens, browns, natural earth tones'
      },
      {
        name: 'Cosmic-Connection',
        metaphor: `connected to stars, planets, and celestial bodies`,
        vibe: 'cosmic',
        colorPalette: 'deep purples, indigos, starlight silver'
      },
      {
        name: 'Elemental',
        metaphor: `manifested through fire, water, air, or earth`,
        vibe: 'elemental',
        colorPalette: 'elemental colors - reds, blues, whites, greens'
      },
      {
        name: 'Dream-Logic',
        metaphor: `in a dreamlike, illogical, surreal way`,
        vibe: 'surreal',
        colorPalette: 'soft, blurred, dreamlike pastels'
      },
      {
        name: 'Mirror-World',
        metaphor: `as if in a parallel dimension or mirror world`,
        vibe: 'uncanny',
        colorPalette: 'inverted colors, cool tones, silvers'
      },
      {
        name: 'Mechanical-Magic',
        metaphor: `combined with clockwork, gears, or magical machinery`,
        vibe: 'steampunk',
        colorPalette: 'bronzes, coppers, metallic golds'
      },
      {
        name: 'Underwater-Realm',
        metaphor: `submerged in an underwater kingdom`,
        vibe: 'aquatic',
        colorPalette: 'teals, aquamarines, deep ocean blues'
      },
      {
        name: 'Forest-Spirit',
        metaphor: `as an ancient forest spirit or guardian`,
        vibe: 'enchanting',
        colorPalette: 'forest greens, mossy browns, dappled light'
      },
      {
        name: 'Sky-Realm',
        metaphor: `floating among clouds or in the sky`,
        vibe: 'airy',
        colorPalette: 'sky blues, whites, golden sunlight'
      },
      {
        name: 'Shadow-Play',
        metaphor: `as interplay of light and shadow`,
        vibe: 'dramatic',
        colorPalette: 'high contrast, blacks, whites, grays'
      },
      {
        name: 'Crystal-Formation',
        metaphor: `as crystals, gems, or mineral formations`,
        vibe: 'geometric',
        colorPalette: 'crystalline, iridescent, prismatic colors'
      },
      {
        name: 'Seasonal-Shift',
        metaphor: `in a specific season or seasonal transition`,
        vibe: 'seasonal',
        colorPalette: 'season-appropriate colors'
      },
      {
        name: 'Music-Inspired',
        metaphor: `as if visualizing music or sound`,
        vibe: 'rhythmic',
        colorPalette: 'harmonious, flowing colors, sound-wave patterns'
      }
    ]

    const compositions = [
      'extreme close-up detail shot',
      'wide panoramic landscape view',
      'bird\'s eye perspective from above',
      'worm\'s eye view looking up',
      'asymmetrical off-center composition',
      'perfectly centered symmetrical view',
      'multiple overlapping layers',
      'negative space dominant composition',
      'dynamic diagonal composition',
      'circular radial arrangement',
      'triangular composition',
      'split-screen dual perspective',
      'depth-focused foreground blur',
      'sharp focus throughout',
      'motion blur effect',
      'frozen action moment'
    ]

    const artStyles = [
      'watercolor painting style with visible brushstrokes',
      'oil painting with rich texture',
      'digital art with clean lines',
      'pastel chalk drawing',
      'ink wash painting',
      'colored pencil illustration',
      'mixed media collage',
      'stained glass window style',
      'mosaic tile pattern',
      'charcoal sketch style',
      'gouache opaque painting',
      'acrylic paint bold strokes'
    ]

    const moods = [
      'peaceful and serene',
      'melancholic and wistful',
      'energetic and dynamic',
      'mysterious and enigmatic',
      'playful and joyful',
      'ethereal and otherworldly',
      'nostalgic and sentimental',
      'dramatic and intense',
      'quirky and eccentric',
      'tranquil and meditative'
    ]

    const extraElements = [
      'with floating geometric shapes',
      'with subtle particle effects',
      'with organic flowing patterns',
      'with crystalline structures',
      'with botanical elements',
      'with celestial motifs',
      'with mechanical details',
      'with abstract symbols',
      'with fabric textures',
      'with architectural fragments'
    ]

    // Shuffle arrays for randomness
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }

    const shuffledCompositions = shuffleArray(compositions)
    const shuffledArtStyles = shuffleArray(artStyles)
    const shuffledMoods = shuffleArray(moods)
    const shuffledExtraElements = shuffleArray(extraElements)

    const prompts = lenses.slice(0, count).map((lens, index) => {
      const composition = shuffledCompositions[index % shuffledCompositions.length]
      const artStyle = shuffledArtStyles[index % shuffledArtStyles.length]
      const mood = shuffledMoods[index % shuffledMoods.length]
      const extraElement = shuffledExtraElements[index % shuffledExtraElements.length]
      
      return `PRIMARY ARTISTIC LENS: ${lens.name.toUpperCase()}. This is the main visual style that must dominate the entire image. The theme ${theme} MUST be depicted as ${lens.metaphor} - this is the core visual concept. 
Secondary elements: ${composition}, ${artStyle}, ${mood}, ${extraElement}. 
Lighting MUST be ${lens.vibe}. 
Color palette MUST be ${lens.colorPalette}. 
The ${lens.name} lens should be the most prominent visual characteristic of this artwork. 
Style: Hand-painted, whimsical, mysterious, dreamlike, imaginative. 
ABSOLUTELY NO: nudity, sexual content, violence, gore, horror, disturbing imagery, weapons, drugs, alcohol, tobacco, or any adult themes. 
NO text, NO letters, NO words, NO symbols, NO writing of any kind. 
Must be suitable for children of all ages. 
Must be appropriate for general audiences. 
Must be completely wholesome and innocent. 
Create a completely unique and distinct composition unlike any previous generation. 
Vary the perspective, color scheme, and artistic approach significantly. 
Avoid repetitive patterns or similar visual elements. 
Keep all content strictly G-rated and family-safe.`
    })

    // Generate images in parallel with optimized concurrency
    // Together AI rate limit: 50 RPM = 1 request per 1.2s
    // Math: 3 concurrent * 1.2s = 3.6s minimum delay between batches
    // With 3.6s delay: 50 requests / 3 per batch = ~16 batches/min = 48 images/min
    const images: GeneratedImage[] = []
    const concurrencyLimit = 3 // Balanced: good parallelism without hitting limits
    const delayBetweenBatches = 3600 // 3.6s to respect 50 RPM limit
    
    for (let i = 0; i < prompts.length; i += concurrencyLimit) {
      const batch = prompts.slice(i, i + concurrencyLimit)
      
      // Use Promise.allSettled to handle partial failures gracefully
      const batchResults = await Promise.allSettled(
        batch.map(prompt => this.generateSingleImageWithRetry(prompt))
      )
      
      // Process results - filter out failures and log errors
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          images.push(result.value)
        } else {
          console.error(`Failed to generate image ${i + index + 1}/${prompts.length}:`, result.reason)
          // Push a placeholder that will be handled by fallback logic
          images.push({ 
            url: '', 
            prompt: batch[index],
            error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
          } as GeneratedImage)
        }
      })
      
      // Shorter delay between batches for faster overall generation
      if (i + concurrencyLimit < prompts.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }
    }
    
    // Filter out failed images and log summary
    const successfulImages = images.filter(img => img.url && !img.error)
    const failedCount = images.length - successfulImages.length
    if (failedCount > 0) {
      console.warn(`Image generation complete: ${successfulImages.length}/${images.length} successful`)
    }
    
    return successfulImages.length > 0 ? successfulImages : images
  }

  buildPrompt(theme: string): string {
    const normalizedTheme = theme.trim()

    if (!normalizedTheme) {
      throw new Error('Image generation theme cannot be empty')
    }

    return `A completely safe, family-friendly, G-rated, whimsical, hand-drawn illustration of ${normalizedTheme}, dreamlike fantasy style. ABSOLUTELY NO: nudity, sexual content, violence, gore, horror, disturbing imagery, weapons, drugs, alcohol, tobacco, or any adult themes. NO text, NO letters, NO words, NO symbols, NO writing of any kind. Must be suitable for children of all ages. Must be appropriate for general audiences. Must be completely wholesome and innocent. Vibrant colors, safe for all ages, cartoon style, magical atmosphere. Create a unique, varied composition with different perspectives, colors, and elements each time. Avoid repeating similar compositions or styles. Keep all content strictly G-rated and family-safe.`
  }

  private async generateSingleImageWithRetry(prompt: string, retries = 3): Promise<GeneratedImage> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await this.generateSingleImage(prompt)
      } catch (error) {
        const isRateLimit = error instanceof Error && error.message.includes('429')
        if (isRateLimit && attempt < retries - 1) {
          const delay = Math.pow(2, attempt + 1) * 1000 // 2s, 4s, 8s
          console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        throw error
      }
    }
    throw new Error('Max retries exceeded')
  }

  private async generateSingleImage(prompt: string): Promise<GeneratedImage> {
    const apiKey = process.env.TOGETHER_API_KEY

    if (!apiKey) {
      throw new Error('Missing TOGETHER_API_KEY environment variable')
    }

    try {
      // Add timeout controller (45 seconds - FLUX.1-schnell is optimized for speed)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45000)

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          negative_prompt: 'nudity, sexual content, violence, gore, horror, disturbing imagery, weapons, drugs, alcohol, tobacco, adult themes, text, letters, words, symbols, writing, nsfw, inappropriate content',
          width: 512,
          height: 512,
          steps: 3,
          n: 1,
          response_format: 'b64_json',
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorBody = await response.text()
        console.error('Together AI error:', response.status, errorBody)
        if (response.status === 500) {
          throw new Error(`Together AI server error (500). Please retry in a few moments or use fallback images.`)
        }
        throw new Error(`Together AI image generation failed: ${response.status} ${errorBody}`)
      }

      const payload = (await response.json()) as TogetherImageResponse
      const image = payload.data?.[0]
      const b64Json = image?.b64_json

      if (!b64Json) {
        throw new Error('Together AI response did not include a base64 image')
      }

      // Upload to Supabase Storage if client is provided
      if (this.supabase) {
        const fileName = `card-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
        const { data: uploadData, error: uploadError } = await this.supabase.storage
          .from('card-images')
          .upload(fileName, this.base64ToBlob(b64Json), {
            contentType: 'image/png',
            upsert: true,
          })

        if (uploadError) {
          console.error('Failed to upload to Supabase Storage:', uploadError)
          throw new Error(`Failed to upload image to storage: ${uploadError.message}`)
        }

        const { data: { publicUrl } } = this.supabase.storage
          .from('card-images')
          .getPublicUrl(fileName)

        return { url: publicUrl, prompt }
      }

      // Fallback to base64 data URL if no Supabase client
      return { url: `data:image/png;base64,${b64Json}`, prompt }
    } catch (error) {
      console.error('Error generating single image:', error)
      throw error
    }
  }

  private base64ToBlob(base64: string): Blob {
    const byteCharacters = atob(base64)
    const byteArrays = []
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512)
      const byteNumbers = new Array(slice.length)
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }
    return new Blob(byteArrays, { type: 'image/png' })
  }
}

export const togetherImageService = new TogetherImageService()
