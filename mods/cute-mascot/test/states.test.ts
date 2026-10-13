import { expect, mock, test } from 'claude-code/testing'

import type { BeeState } from '../hooks/bee-state'
import { transition } from '../hooks/bee-state'
import { beeText } from '../hooks/bee-text'
import { maskCommand } from '../hooks/mask'

const IDLE: BeeState = { kind: 'Idle' }
const WORKING: BeeState = { kind: 'Working' }
const SAD: BeeState = { kind: 'Sad', cause: 'bash', command: 'false' }

const dump = (tree: unknown): string => JSON.stringify(tree)

test('3.1: session-start gives Idle', () => {
  expect(transition(SAD, { type: 'session-start' })).toEqual(IDLE)
})

test('3.2: turn-start gives Working', () => {
  expect(transition(IDLE, { type: 'turn-start' })).toEqual(WORKING)
})

test('3.3: a Bash failure gives Sad with the masked command', () => {
  expect(transition(WORKING, { type: 'tool-end', isBashFailure: true, command: 'API_KEY=abc123 false' })).toEqual({
    kind: 'Sad',
    cause: 'bash',
    command: 'API_KEY=*** false',
  })
})

test('3.4: a denied call raises no event, so the state is unchanged', () => {
  expect(transition(SAD, { type: 'turn-start' }).kind).toBe('Working')
  expect(transition(SAD, { type: 'tool-end', isBashFailure: false }).kind).toBe('Working')
  expect(transition(IDLE, { type: 'tool-end', isBashFailure: false })).toEqual(IDLE)
})

test('3.5: tool-start turns Sad into Working', () => {
  expect(transition(SAD, { type: 'tool-start' })).toEqual(WORKING)
})

test('3.6: answer gives Happy with its duration', () => {
  expect(transition(SAD, { type: 'turn-end', reason: 'answer', durationMs: 5000 })).toEqual({ kind: 'Happy', durationMs: 5000 })
})

test('3.7 3.8: error and refusal give Sad with cause turn', () => {
  for (const reason of ['error', 'refusal'] as const) {
    expect(transition(WORKING, { type: 'turn-end', reason, durationMs: 1 })).toEqual({ kind: 'Sad', cause: 'turn' })
  }
})

test('3.9: aborted gives Idle', () => {
  expect(transition(WORKING, { type: 'turn-end', reason: 'aborted', durationMs: 1 })).toEqual(IDLE)
})

test('3.10: tool-start outside Sad leaves the state', () => {
  expect(transition(WORKING, { type: 'tool-start' })).toBe(WORKING)
  expect(transition({ kind: 'Happy', durationMs: 1 }, { type: 'tool-start' })).toEqual({ kind: 'Happy', durationMs: 1 })
})

test('3.12: a call that ends without failure turns Sad into Working', () => {
  expect(transition(SAD, { type: 'tool-end', isBashFailure: false })).toEqual(WORKING)
})

test('3.11: an agent id on any event leaves the state', () => {
  const events = [
    { type: 'turn-end', reason: 'answer', durationMs: 9, agentId: 'a' },
    { type: 'tool-end', isBashFailure: true, command: 'x', agentId: 'a' },
    { type: 'tool-start', agentId: 'a' },
  ] as const

  for (const event of events) {
    expect(transition(SAD, event)).toBe(SAD)
  }
})

test('3.11: a tool.check with an agent id leaves the Bee_State', async ($, on) => {
  on('session.start', (_: any, e: any) => ({ cwd: e.cwd }))
  on('command.register', (_: any, e: any) => ({ value: { command: e.name } }))
  on('tool.check', () => ({ decision: 'allow' }))
  on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Text', props: {}, children: ['engine band'] }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.tool.check({ tool: 'Bash', input: {}, tool_use_id: 't1', agentId: 'sub' })
  const ui = await $.ui.mount({
    plugin: 'cute-mascot',
    surface: 'terminal',
    component: 'AbovePrompt',
    requestId: 'band',
    props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 80, scroll: { bodyRows: 18 } } as any,
  })

  expect(dump(await ui.drawn())).toContain('Rảnh quá')
})

test('4.3: each Bee_Text row word for word', () => {
  expect(beeText({ kind: 'Idle' })).toBe('Rảnh quá, giao việc đi chứ 😴')
  expect(beeText(WORKING)).toBe('Đừng nhìn, ong đang tập trung 😤')
  expect(beeText(SAD)).toBe('Lệnh fail: false — code ai viết vậy 🤨')
  expect(beeText({ kind: 'Sad', cause: 'turn' })).toBe('API sập, đổ tại server cho nhanh')
  expect(beeText({ kind: 'Happy', durationMs: 12000 })).toBe('12s xong, nhanh hơn anh dev thật 😎')
})

test('4.12 4.13: maskCommand keeps the first line and hides each Secret_Form', () => {
  expect(maskCommand('API_KEY=abc123 false')).toBe('API_KEY=*** false')
  expect(maskCommand('curl -H Bearer tok123')).toBe('curl -H Bearer ***')
  expect(maskCommand('run --token abc --password=hunter2')).toBe('run --token *** --password=***')
  expect(maskCommand('echo one\necho two')).toBe('echo one')
  expect(maskCommand('x'.repeat(100))).toHaveLength(40)
})

test('4.4 4.5 4.7: the timer Blits the next frame, and none with Reduced_Motion', async ($, on) => {
  const clock = mock.clock(on)
  const blits: string[] = []
  let settings: Record<string, unknown> = {}
  on('session.start', (_: any, e: any) => ({ cwd: e.cwd }))
  on('command.register', (_: any, e: any) => ({ value: { command: e.name } }))
  on('settings.read', () => ({ value: settings }))
  on('ui.blit', (_: any, e: any) => {
    blits.push(e.cells)

    return { value: {} }
  })
  on('turn.start', (_: any, e: any) => ({ turnId: e.turnId }))
  on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Text', props: {}, children: ['engine band'] }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.ui.mount({
    plugin: 'cute-mascot',
    surface: 'terminal',
    component: 'AbovePrompt',
    requestId: 'band',
    props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 80, scroll: { bodyRows: 18 } } as any,
  })
  await $.turn.start({ text: 'hi', turnId: 't' })
  await clock.advance(250)
  await clock.advance(250)

  expect(blits.length).toBeGreaterThan(0)
  expect(new Set(blits).size).toBe(2)
  settings = { prefersReducedMotion: true }
  await $.turn.start({ text: 'hi', turnId: 't2' })
  const before = blits.length
  await clock.advance(1000)

  expect(blits.length).toBe(before)
})
