import type { BeeState } from '../types'

export const SPRITE_COLUMNS = 12
export const SPRITE_ROWS = 4

const EMPTY = 0x01000000
const YELLOW = 0xffd21f
const BLACK = 0x1a1a1a
const WING = 0xe8f4ff

/** `SPRITE_COLUMNS` by `2 * SPRITE_ROWS` pixels, row-major. */
export type Sprite = readonly (readonly number[])[]

const COLOUR_OF: Readonly<Record<string, number>> = { '.': EMPTY, Y: YELLOW, K: BLACK, W: WING }

const WINGS_DOWN = ['..K..K..', '.YYYYYY.', 'YKYKYKYK', 'YKYKYYYY', '.YKYKYY.', '..YYYY..', '.W....W.', '........']
const WINGS_UP = ['W.K..K.W', 'WYYYYYYW', 'YKYKYKYK', 'YKYKYYYY', '.YKYKYY.', '..YYYY..', '........', '........']
const SAD_ART = ['..K..K..', '.YYYYYY.', 'YKYKYKYK', 'YKYKYYYY', '.YKYKKY.', '..YKKY..', '.W....W.', '........']

function toSprite(art: readonly string[], offset: number): Sprite {
  return art.map(row =>
    Array.from({ length: SPRITE_COLUMNS }, (_, x) => COLOUR_OF[row[x - offset] ?? '.'] ?? EMPTY),
  )
}

const HAPPY_OFFSETS = [0, 1, 2, 3, 4, 3, 2, 1]
const IDLE_FRAME = toSprite(WINGS_DOWN, 0)
const WORKING_FRAMES = [IDLE_FRAME, toSprite(WINGS_UP, 0)]
const SAD_FRAME = toSprite(SAD_ART, 0)
const HAPPY_FRAMES = HAPPY_OFFSETS.map((offset, i) => toSprite(i % 2 === 0 ? WINGS_DOWN : WINGS_UP, offset))

/** One Frame per `tick`; with Reduced_Motion the first Frame of the state, whatever the `tick`. */
export function frameFor(kind: BeeState['kind'], tick: number, isReducedMotion: boolean): Sprite {
  const at = isReducedMotion ? 0 : tick

  switch (kind) {
    case 'Idle':
      return IDLE_FRAME
    case 'Working':
      return WORKING_FRAMES[at % 2]
    case 'Sad':
      return SAD_FRAME
    case 'Happy':
      return HAPPY_FRAMES[at % 8]
  }
}

/** Packs two stacked pixels into one `▀` cell: the upper one in the foreground, the lower in the background. */
export function encodeCells(sprite: Sprite): string {
  const words = new Uint32Array(SPRITE_COLUMNS * SPRITE_ROWS * 3)

  for (let row = 0; row < SPRITE_ROWS; row++) {
    for (let x = 0; x < SPRITE_COLUMNS; x++) {
      const upper = sprite[row * 2][x]
      const lower = sprite[row * 2 + 1][x]
      const isBlank = upper === EMPTY && lower === EMPTY
      const at = (row * SPRITE_COLUMNS + x) * 3

      words[at] = isBlank ? 0x20 : 0x2580
      words[at + 1] = upper
      words[at + 2] = lower
    }
  }

  return new Uint8Array(words.buffer).toBase64()
}
