import { expect, mock, test } from 'claude-code/testing'

import { alertFor } from '../hooks/alert'
import { STORE_FAILED } from '../hooks/commands'
import { tingWav } from '../hooks/ting'

const LONG = 150_000
const dump = (tree: unknown): string => JSON.stringify(tree)

type Spy = { plays: string[]; notes: { text: string; title?: string }[] }

function engine(on: any, spy: Spy, options: { playDenied?: boolean; notifySent?: boolean } = {}) {
  on('session.start', (_: any, e: any) => ({ cwd: e.cwd }))
  on('command.register', (_: any, e: any) => ({ value: { command: e.name } }))
  on('turn.complete', (_: any, e: any) => ({ text: e.answer }))
  on('audio.play', (_: any, e: any) => {
    spy.plays.push(e.clip.asset)

    return options.playDenied ? { deny: 'blocked' } : { value: undefined }
  })
  on('ui.notify', (_: any, e: any) => {
    spy.notes.push(e)

    return { value: options.notifySent === false ? { isSent: false, reason: 'refused' } : { isSent: true, channel: 'iterm2' } }
  })
  on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Text', props: {}, children: ['engine band'] }))
}

const complete = ($: any, reason: string, durationMs: number, agentId?: string) =>
  $.turn.complete({ answer: 'x', durationMs, isAborted: reason === 'aborted', turnId: 't', reason, agentId })

const start = ($: any) => $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

const BAND = { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 80, scroll: { bodyRows: 18 } } as any

test('6.1: a Long_Turn ending answer plays sounds/ting.wav once', async ($, on) => {
  const spy: Spy = { plays: [], notes: [] }
  engine(on, spy)
  await start($)
  await complete($, 'answer', LONG)

  expect(spy.plays).toEqual(['sounds/ting.wav'])
})

test('6.2 6.3 6.4: the notify argument holds exactly text and title', async ($, on) => {
  const spy: Spy = { plays: [], notes: [] }
  engine(on, spy)
  await start($)
  await complete($, 'answer', 150_000)
  await complete($, 'error', 61_000 * 3)

  expect(spy.notes).toEqual([
    { text: 'Xong sau 2m 30s', title: 'Claude Code' },
    { text: 'Lỗi sau 3m 3s', title: 'Claude Code' },
  ])
})

test('6.9 6.10: a stored Muted plays nothing and notifies nothing', async ($, on) => {
  const spy: Spy = { plays: [], notes: [] }
  mock.store(on, { muted: true })
  engine(on, spy)
  await start($)
  await complete($, 'answer', LONG)

  expect(spy.plays).toEqual([])
  expect(spy.notes).toEqual([])
})

test('6.15: an unreadable store reads as not Muted', async ($, on) => {
  const spy: Spy = { plays: [], notes: [] }
  on('store.get', () => ({ deny: 'unreadable' }))
  engine(on, spy)
  await start($)
  await complete($, 'answer', LONG)

  expect(spy.plays).toEqual(['sounds/ting.wav'])
})

test('6.11 6.12: a store set that rejects answers STORE_FAILED and keeps the flags', async ($, on) => {
  const spy: Spy = { plays: [], notes: [] }
  on('store.set', () => ({ deny: 'full' }))
  engine(on, spy)
  await start($)
  const run = (args: string) => $.command.run({ command: 'bee', args, origin: 'user', presentation: 'text' })

  expect(STORE_FAILED).toBe('Ong quên mất rồi, thử lại sau nhé')
  expect((await run('mute')).text).toBe(STORE_FAILED)
  await complete($, 'answer', LONG)

  expect(spy.plays).toEqual(['sounds/ting.wav'])
})

test('6.11 6.12 6.13 6.14: mute and unmute answer by the table', async ($, on) => {
  const spy: Spy = { plays: [], notes: [] }
  mock.store(on)
  engine(on, spy)
  await start($)
  const run = (args: string) => $.command.run({ command: 'bee', args, origin: 'user', presentation: 'text' })

  expect((await run('mute')).text).toBe('Ong câm nín rồi đó 🤐')
  expect((await run('mute')).text).toBe('Im re sẵn rồi, đừng bắt im nữa 🤐')
  await complete($, 'answer', LONG)
  expect(spy.plays).toEqual([])
  expect((await run('unmute')).text).toBe('Ong lại được hó hé rồi 🔔')
  expect((await run('unmute')).text).toBe('Đang kêu sẵn rồi, muốn ồn hơn à 🔔')
  await complete($, 'answer', LONG)
  expect(spy.plays).toEqual(['sounds/ting.wav'])
})

test('3.11: a Subagent\'s Long_Turn plays nothing', async ($, on) => {
  const spy: Spy = { plays: [], notes: [] }
  engine(on, spy)
  await start($)
  await complete($, 'answer', LONG, 'sub-1')

  expect(spy.plays).toEqual([])
  expect(spy.notes).toEqual([])
})

test('6.17: a blocked sound or an unsent notification keeps the Bee_State', async ($, on) => {
  const spy: Spy = { plays: [], notes: [] }
  engine(on, spy, { playDenied: true, notifySent: false })
  await start($)
  const ui = await $.ui.mount({ plugin: 'cute-mascot', surface: 'terminal', component: 'AbovePrompt', requestId: 'band', props: BAND })
  await complete($, 'answer', LONG)
  await ui.redraw()

  expect(dump(await ui.drawn())).toContain('2m 30s xong, nhanh hơn anh dev thật 😎')
})

test('6.5 6.6 6.7 6.8: alertFor stays silent at 120000 ms or less and on abort', () => {
  expect(alertFor({ reason: 'answer', durationMs: 120_000 }, false)).toEqual({ sound: false })
  expect(alertFor({ reason: 'aborted', durationMs: LONG }, false)).toEqual({ sound: false })
  expect(alertFor({ reason: 'answer', durationMs: 120_001 }, false).sound).toBe(true)
})

test('6.16: tingWav is a 0.4 s, 44100 Hz, mono, 16-bit WAV', () => {
  const wav = tingWav()
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength)
  const text = (at: number) => String.fromCharCode(...wav.slice(at, at + 4))

  expect(text(0)).toBe('RIFF')
  expect(text(8)).toBe('WAVE')
  expect(view.getUint16(22, true)).toBe(1)
  expect(view.getUint32(24, true)).toBe(44100)
  expect(view.getUint16(34, true)).toBe(16)
  expect(view.getUint32(40, true)).toBe(17640 * 2)
  expect(wav.byteLength).toBe(44 + 17640 * 2)
})
