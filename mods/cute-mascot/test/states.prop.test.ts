import { expect, test } from 'claude-code/testing'

import type { BeeEvent, BeeState } from '../hooks/bee-state'
import { transition } from '../hooks/bee-state'
import { beeText } from '../hooks/bee-text'
import { formatDuration } from '../hooks/duration'
import { maskCommand } from '../hooks/mask'
import { SPRITE_COLUMNS, frameFor } from '../hooks/sprite'

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

const REASONS = ['answer', 'aborted', 'refusal', 'error'] as const

function genEvent(rnd: () => number, isAgent: boolean): BeeEvent {
  const agentId = isAgent ? 'a1' : undefined
  const n = Math.floor(rnd() * 5)

  switch (n) {
    case 0:
      return { type: 'session-start' }
    case 1:
      return { type: 'turn-start' }
    case 2:
      return { type: 'tool-start', agentId }
    case 3:
      return { type: 'tool-end', agentId, isBashFailure: rnd() < 0.5, command: 'cmd' }
    default:
      return { type: 'turn-end', agentId, reason: REASONS[Math.floor(rnd() * 4)], durationMs: Math.floor(rnd() * 1e6) }
  }
}

test('3.1 3.2 3.3 3.4 3.5 3.6 3.7 3.8 3.9 3.10 3.11 3.12: transition follows the table over event sequences', () => {
  const rnd = xorshift(21)

  for (let i = 0; i < CASES; i++) {
    let state: BeeState = { kind: 'Idle' }

    for (let k = 0, n = 1 + Math.floor(rnd() * 40); k < n; k++) {
      const event = genEvent(rnd, rnd() < 1 / 3)
      const next = transition(state, event)

      if ('agentId' in event && event.agentId !== undefined) {
        expect(next).toBe(state)
      } else if (event.type === 'turn-start') {
        expect(next.kind).toBe('Working')
      } else if (event.type === 'turn-end') {
        expect(next.kind).toBe(event.reason === 'answer' ? 'Happy' : event.reason === 'aborted' ? 'Idle' : 'Sad')
      } else if (event.type === 'tool-end' && event.isBashFailure) {
        expect(next.kind).toBe('Sad')
      }

      state = next
    }
  }
})

test('4.12 4.13: maskCommand returns at most 40 characters, one line, and no secret value', () => {
  const rnd = xorshift(33)
  const words = ['ls', '-la', 'echo', 'foo/bar', 'x']
  const forms = (secret: string) => [`KEY=${secret}`, `Bearer ${secret}`, `--token ${secret}`, `--password=${secret}`]

  for (let i = 0; i < CASES; i++) {
    const secret = `s${Math.floor(rnd() * 1e9)}zz`
    const parts: string[] = []

    for (let k = 0, n = Math.floor(rnd() * 8); k < n; k++) {
      parts.push(rnd() < 0.4 ? forms(secret)[Math.floor(rnd() * 4)] : words[Math.floor(rnd() * words.length)])
      if (rnd() < 0.15) parts.push('\n')
    }

    const out = maskCommand(parts.join(' ').slice(0, 200))

    expect(out.length).toBeLessThanOrEqual(40)
    expect(out.includes('\n')).toBe(false)
    expect(out.includes(secret)).toBe(false)
  }
})

test('4.4 4.5 4.6 4.7: frames follow the schedule and Reduced_Motion pins one frame', () => {
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

  expect(same(frameFor('Working', 0, false), frameFor('Working', 2, false))).toBe(true)
  expect(same(frameFor('Working', 0, false), frameFor('Working', 1, false))).toBe(false)
  expect(same(frameFor('Happy', 0, false), frameFor('Happy', 8, false))).toBe(true)

  const distinct = new Set(Array.from({ length: 8 }, (_, t) => JSON.stringify(frameFor('Happy', t, false))))

  expect(distinct.size).toBe(5)

  for (const kind of ['Idle', 'Working', 'Sad', 'Happy'] as const) {
    for (let t = 1; t < 100; t++) {
      expect(same(frameFor(kind, t, true), frameFor(kind, 0, true))).toBe(true)
    }
  }

  expect(same(frameFor('Sad', 0, false), frameFor('Sad', 7, false))).toBe(true)
  expect(frameFor('Happy', 3, false)[0]).toHaveLength(SPRITE_COLUMNS)
})

test('4.3 4.12: beeText gives the table row for every state', () => {
  const rnd = xorshift(44)

  for (let i = 0; i < CASES; i++) {
    const ms = Math.floor(rnd() * 36_000_000)
    const command = `c${Math.floor(rnd() * 1e6)}`

    expect(beeText({ kind: 'Happy', durationMs: ms })).toBe(`${formatDuration(ms)} xong, nhanh hơn anh dev thật 😎`)
    expect(beeText({ kind: 'Sad', cause: 'bash', command })).toBe(`Lệnh fail: ${command} — code ai viết vậy 🤨`)
  }
})
