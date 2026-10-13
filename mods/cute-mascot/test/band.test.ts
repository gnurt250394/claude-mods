import { expect, test } from 'claude-code/testing'

import { beeText } from '../hooks/bee-text'
import { beeCommand } from '../hooks/commands'
import { SPRITE_COLUMNS, encodeCells, frameFor } from '../hooks/sprite'

const PLUGIN = 'cute-mascot'

const BAND = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 20,
  bodyColumns: 80,
  scroll: { bodyRows: 18 },
} as any

const dump = (tree: unknown): string => JSON.stringify(tree)

function engine(on: any) {
  on('session.start', (_: any, e: any) => ({ cwd: e.cwd }))
  on('session.end', (_: any, e: any) => ({ sessionId: e.sessionId }))
  on('command.register', (_: any, e: any) => ({ value: { command: e.name } }))
  on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Text', props: {}, children: ['engine band'] }))
}

async function startSession($: any) {
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
}

async function mountBand($: any, props: object = BAND, requestId = 'band') {
  return $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', requestId, props })
}

test('3.1: session.start shows Idle', async ($, on) => {
  engine(on)
  await startSession($)
  const ui = await mountBand($)

  expect(dump(await ui.drawn())).toContain('Rảnh quá, giao việc đi chứ 😴')
})

test('4.3: the Idle Bee_Text word for word', () => {
  expect(beeText({ kind: 'Idle' })).toBe('Rảnh quá, giao việc đi chứ 😴')
})

test('4.3 4.1: the Bee_Text box starts at column 19, past the 17 Raster columns', async ($, on) => {
  engine(on)
  await startSession($)
  const ui = await mountBand($)
  const raster = await ui.find({ type: 'Raster' })

  expect(SPRITE_COLUMNS).toBe(17)
  expect(raster).toBeDefined()
  expect(dump(await ui.drawn())).toContain('"marginLeft":1')
  expect(dump(await ui.drawn())).toContain('"columns":17')
  expect(dump(await ui.drawn())).toContain('"rows":6')
})

test('4.11: every Raster cell decodes to U+2580 or U+0020', () => {
  const bytes = Uint8Array.fromBase64(encodeCells(frameFor('Idle', 0, false)))
  const words = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)

  for (let i = 0; i < words.length; i += 3) {
    expect([0x2580, 0x20]).toContain(words[i])
  }
})

test('4.9 4.10 5.1: the Band_Site hides under 32 columns and on a survey, and shows the Hide_Button', async ($, on) => {
  engine(on)
  await startSession($)
  const shown = await mountBand($, { ...BAND, bodyColumns: 32 }, 'a')
  expect(dump(await shown.drawn())).toContain('Đuổi ong 🐝')
  expect(await shown.find({ key: 'hide' })).toBeDefined()

  const narrow = await mountBand($, { ...BAND, bodyColumns: 31 }, 'b')
  expect(dump(await narrow.drawn())).toContain('engine band')

  const survey = await mountBand($, { ...BAND, hasSurvey: true }, 'c')
  expect(dump(await survey.drawn())).toContain('engine band')
})

test('5.2 5.6: pressing hide hides the band; a raised session.start shows it again', async ($, on) => {
  engine(on)
  await startSession($)
  const ui = await mountBand($)
  await ui.press({ key: 'hide' })
  expect(dump(await ui.drawn())).toContain('engine band')

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await ui.redraw()
  expect(dump(await ui.drawn())).toContain('Đuổi ong 🐝')
})

test('5.7: a session.end with reason clear and no session.start keeps isHidden true', async ($, on) => {
  engine(on)
  await startSession($)
  const ui = await mountBand($)
  await ui.press({ key: 'hide' })
  await $.session.end({ reason: 'clear', sessionId: 's', resume: null })
  await ui.redraw()

  expect(dump(await ui.drawn())).toContain('engine band')
})

test('5.3 5.4 5.5 5.8: /bee and /bee hide through command.run', async ($, on) => {
  engine(on)
  await startSession($)
  const run = (args: string) => $.command.run({ command: 'bee', args, origin: 'user', presentation: 'text' })

  expect((await run('hide')).text).toBe('Ong đi đây, có gì gõ /bee 😤')
  expect((await run('hide')).text).toBe('Ong đi rồi mà, nhớ thì gõ /bee 🐝')
  expect((await run('')).text).toBe('Ong về rồi đây, nhớ ong à 🐝')
  expect((await run('')).text).toBe('Ong đang ở đây rồi')
  expect((await run('xyz')).text).toBe('Ong không hiểu. Dùng: /bee, /bee hide, /bee mute, /bee unmute')
})

test('5.3 5.4 5.5 5.8: beeCommand rows return new flags and repeat their input', () => {
  const shown = { isHidden: false, isMuted: false }
  const hidden = { isHidden: true, isMuted: false }

  expect(beeCommand('hide', shown).flags).toEqual(hidden)
  expect(beeCommand('hide', hidden).flags).toBe(hidden)
  expect(beeCommand('', hidden).flags).toEqual(shown)
  expect(beeCommand('', shown).flags).toBe(shown)
})
