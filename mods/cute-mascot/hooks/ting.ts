const RATE = 44100
const SAMPLES = 17640
const SWITCH_S = 0.18
const FADE_S = 0.01
const GAIN = 0.4
const C6_HZ = 1046.5
const E6_HZ = 1318.51

function sampleAt(i: number): number {
  const t = i / RATE
  const isFirst = t < SWITCH_S
  const length = isFirst ? SWITCH_S : SAMPLES / RATE - SWITCH_S
  const local = t - (isFirst ? 0 : SWITCH_S)
  const envelope = Math.min(1, local / FADE_S, (length - local) / FADE_S)

  return Math.round(Math.sin(2 * Math.PI * (isFirst ? C6_HZ : E6_HZ) * local) * envelope * GAIN * 32767)
}

/** The Ting_Sound as a whole 16-bit mono WAV file: two sine notes, C6 then E6. */
export function tingWav(): Uint8Array {
  const bytes = new Uint8Array(44 + SAMPLES * 2)
  const view = new DataView(bytes.buffer)
  const tag = (at: number, text: string) => [...text].forEach((c, k) => view.setUint8(at + k, c.charCodeAt(0)))

  tag(0, 'RIFF')
  view.setUint32(4, 36 + SAMPLES * 2, true)
  tag(8, 'WAVE')
  tag(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, RATE, true)
  view.setUint32(28, RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  tag(36, 'data')
  view.setUint32(40, SAMPLES * 2, true)

  for (let i = 0; i < SAMPLES; i++) {
    view.setInt16(44 + i * 2, sampleAt(i), true)
  }

  return bytes
}
