import { expect, test } from 'claude-code/testing'

import { PHRASES, pick, remember, spinnerWord } from '../hooks/phrases'

const CASES = 500
const MODES = ['thinking', 'requesting', 'responding', 'tool-input', 'tool-use']

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

test('1.1 1.2: spinnerWord is emoji, a space, then a phrase of the Mode', () => {
  const rnd = xorshift(1)

  for (let i = 0; i < CASES; i++) {
    const mode = MODES[Math.floor(rnd() * MODES.length)]
    const word = spinnerWord(mode, rnd())
    const { emoji, phrases } = PHRASES[mode]

    expect(phrases.map(p => `${emoji} ${p}`)).toContain(word)
  }
})

test('1.2: pick gives each of the four items an equal interval of r', () => {
  const items = ['a', 'b', 'c', 'd']

  for (let i = 0; i < CASES; i++) {
    const k = i % 4
    const r = (k + (i % 97) / 97 * 0.999) / 4

    expect(pick(items, r)).toBe(items[k])
  }

  expect(pick(items, 0)).toBe('a')
  expect(pick(items, 0.9999999)).toBe('d')
})

test('1.3: remember keeps the first value and never writes the old table', () => {
  const rnd = xorshift(7)

  for (let i = 0; i < CASES; i++) {
    const key = MODES[Math.floor(rnd() * MODES.length)]
    const table = Object.freeze({ other: 'x' })
    const first = remember(table, key, () => `v${i}`)

    expect(table).toEqual({ other: 'x' })
    expect(first.value).toBe(`v${i}`)

    const second = remember(first.table, key, () => 'changed')

    expect(second.value).toBe(`v${i}`)
    expect(second.table[key]).toBe(`v${i}`)
  }
})

test('1.4 1.5: a value outside the five Modes gives undefined', () => {
  const rnd = xorshift(11)

  for (let i = 0; i < CASES; i++) {
    const mode = `m${Math.floor(rnd() * 1e9)}`

    expect(spinnerWord(mode, rnd())).toBeUndefined()
  }
})
