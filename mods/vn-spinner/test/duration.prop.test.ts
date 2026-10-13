import { expect, test } from 'claude-code/testing'

import { formatDuration } from '../hooks/duration'
import { TURN_PHRASES, remember } from '../hooks/phrases'

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

test('2.2: formatDuration reads <s>s under 60 whole seconds and <m>m <s>s from 60', () => {
  const rnd = xorshift(3)

  for (let i = 0; i < CASES; i++) {
    const ms = Math.floor(rnd() * 7_200_000)
    const total = Math.floor(ms / 1000)
    const expected = total < 60 ? `${total}s` : `${Math.floor(total / 60)}m ${total % 60}s`

    expect(formatDuration(ms)).toBe(expected)
  }
})

test('2.1 2.2 2.3: every template holds {t} once, and a remembered phrase keeps its key', () => {
  const rnd = xorshift(5)

  expect(TURN_PHRASES).toHaveLength(4)

  for (const template of TURN_PHRASES) {
    expect(template.split('{t}')).toHaveLength(2)
  }

  for (let i = 0; i < CASES; i++) {
    const key = `req-${Math.floor(rnd() * 50)}`
    const first = remember({}, key, () => TURN_PHRASES[Math.floor(rnd() * TURN_PHRASES.length)])
    const again = remember(first.table, key, () => 'other')

    expect(again.value).toBe(first.value)
  }
})
