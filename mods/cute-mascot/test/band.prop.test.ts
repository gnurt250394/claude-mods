import { expect, test } from 'claude-code/testing'

import { beeCommand } from '../hooks/commands'
import type { BeeState } from '../hooks/bee-state'
import { SPRITE_COLUMNS, SPRITE_ROWS, encodeCells, frameFor } from '../hooks/sprite'

const CASES = 500

function xorshift(seed: number) {
  let s = seed >>> 0 || 1

  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0

    return s / 4294967296
  }
}

const KINDS: BeeState['kind'][] = ['Idle', 'Working', 'Sad', 'Happy']
const COLOURS = [0xffd21f, 0x1a1a1a, 0xe8f4ff, 0x01000000]

test('4.1 4.2 4.3 4.11: every Frame is 12 by 4 cells of U+2580 or U+0020 in the four colours', () => {
  const bytes = (kind: BeeState['kind'], tick: number, reduced: boolean) => {
    const raw = Uint8Array.fromBase64(encodeCells(frameFor(kind, tick, reduced)))

    return new Uint32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4)
  }

  expect(SPRITE_COLUMNS * SPRITE_ROWS).toBe(48)

  for (const kind of KINDS) {
    for (let tick = 0; tick <= 100; tick++) {
      for (const reduced of [false, true]) {
        const words = bytes(kind, tick, reduced)

        expect(words.length).toBe(SPRITE_COLUMNS * SPRITE_ROWS * 3)

        for (let i = 0; i < words.length; i += 3) {
          expect([0x2580, 0x20]).toContain(words[i])
          expect(COLOURS).toContain(words[i + 1])
          expect(COLOURS).toContain(words[i + 2])
        }
      }
    }
  }
})

test('4.8 4.9 4.10 5.1 5.2: the Idle Frame holds yellow and black stripes', () => {
  const raw = Uint8Array.fromBase64(encodeCells(frameFor('Idle', 0, false)))
  const words = new Uint32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4)
  const colours = new Set<number>()

  for (let i = 0; i < words.length; i += 3) {
    colours.add(words[i + 1])
    colours.add(words[i + 2])
  }

  expect(colours.has(0xffd21f)).toBe(true)
  expect(colours.has(0x1a1a1a)).toBe(true)
})

test('5.3 5.4 5.5 5.8: beeCommand replies by the table and a repeat returns its input flags', () => {
  const rnd = xorshift(9)
  const forms = ['', 'hide']

  for (let i = 0; i < CASES; i++) {
    const flags = { isHidden: rnd() < 0.5, isMuted: rnd() < 0.5 }
    const args = rnd() < 0.5 ? forms[Math.floor(rnd() * 2)] : `x${Math.floor(rnd() * 1e6)}`
    const out = beeCommand(args, flags)

    if (args === 'hide') {
      expect(out.flags.isHidden).toBe(true)
      expect(out.flags.isMuted).toBe(flags.isMuted)
      expect(out.text).toBe(flags.isHidden ? 'Ong đi rồi mà, nhớ thì gõ /bee 🐝' : 'Ong đi đây, có gì gõ /bee 😤')
      if (flags.isHidden) expect(out.flags).toBe(flags)
    } else if (args === '') {
      expect(out.flags.isHidden).toBe(false)
      expect(out.text).toBe(flags.isHidden ? 'Ong về rồi đây, nhớ ong à 🐝' : 'Ong đang ở đây rồi')
      if (!flags.isHidden) expect(out.flags).toBe(flags)
    } else {
      expect(out.flags).toBe(flags)
      expect(out.text).toBe('Ong không hiểu. Dùng: /bee, /bee hide, /bee mute, /bee unmute')
    }
  }
})
