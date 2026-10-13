import { expect, test } from 'claude-code/testing'

import { alertFor } from '../hooks/alert'
import { beeCommand } from '../hooks/commands'
import { formatDuration } from '../hooks/duration'
import { tingWav } from '../hooks/ting'

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

test('6.1 6.2 6.3 6.5 6.6 6.7 6.8 6.9 6.10: alertFor alerts only for an unmuted Long_Turn that is not aborted', () => {
  const rnd = xorshift(55)
  const reasons = ['answer', 'aborted', 'refusal', 'error']

  for (let i = 0; i < CASES; i++) {
    const reason = reasons[Math.floor(rnd() * 4)]
    const durationMs = rnd() < 0.2 ? [120_000, 120_001][Math.floor(rnd() * 2)] : Math.floor(rnd() * 600_000)
    const isMuted = rnd() < 0.5
    const out = alertFor({ reason, durationMs }, isMuted)
    const shouldAlert = !isMuted && durationMs > 120_000 && reason !== 'aborted'

    expect(out.sound).toBe(shouldAlert)

    if (shouldAlert) {
      const body = `${reason === 'answer' ? 'Xong' : 'Lỗi'} sau ${formatDuration(durationMs)}`

      expect(out.notification).toEqual({ title: 'Claude Code', body })
    } else {
      expect(out.notification).toBeUndefined()
    }

    expect(alertFor({ reason, durationMs, agentId: 'a' }, isMuted)).toEqual({ sound: false })
  }
})

test('6.16: every sample of tingWav is its two-sine formula', () => {
  const wav = tingWav()
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength)
  const RATE = 44100
  const fade = 0.01

  const expected = (i: number) => {
    const t = i / RATE
    const isFirst = t < 0.18
    const start = isFirst ? 0 : 0.18
    const length = isFirst ? 0.18 : 0.22
    const local = t - start
    const envelope = Math.min(1, local / fade, (length - local) / fade)
    const hz = isFirst ? 1046.5 : 1318.51

    return Math.round(Math.sin(2 * Math.PI * hz * local) * envelope * 0.4 * 32767)
  }

  const indexes = [0, 1, 440, 441, 7919, 7920, 7921, 8360, 17638, 17639]
  const rnd = xorshift(77)

  for (let k = 0; k < CASES; k++) indexes.push(Math.floor(rnd() * 17640))

  for (const i of indexes) {
    expect(Math.abs(view.getInt16(44 + i * 2, true) - expected(i))).toBeLessThanOrEqual(1)
  }
})

test('6.11 6.12 6.13 6.14: mute and unmute rows return their flags and repeat their input', () => {
  const rnd = xorshift(88)

  for (let i = 0; i < CASES; i++) {
    const flags = { isHidden: rnd() < 0.5, isMuted: rnd() < 0.5 }
    const mute = beeCommand('mute', flags)
    const unmute = beeCommand('unmute', flags)

    expect(mute.flags.isMuted).toBe(true)
    expect(mute.flags.isHidden).toBe(flags.isHidden)
    expect(mute.text).toBe(flags.isMuted ? 'Im re sẵn rồi, đừng bắt im nữa 🤐' : 'Ong câm nín rồi đó 🤐')
    if (flags.isMuted) expect(mute.flags).toBe(flags)

    expect(unmute.flags.isMuted).toBe(false)
    expect(unmute.text).toBe(flags.isMuted ? 'Ong lại được hó hé rồi 🔔' : 'Đang kêu sẵn rồi, muốn ồn hơn à 🔔')
    if (!flags.isMuted) expect(unmute.flags).toBe(flags)
  }
})
