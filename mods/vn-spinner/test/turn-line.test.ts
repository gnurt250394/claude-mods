import { expect, test } from 'claude-code/testing'

import { TURN_PHRASES } from '../hooks/phrases'

const TEMPLATES = [
  '🎉 Đã cày xong sau {t}',
  '😎 Ngon lành sau {t}',
  '🐝 Ong về tổ sau {t}',
  '🥵 Vật vã {t} mới xong',
]

const texts = (tree: unknown): string => JSON.stringify(tree)

test('2.1: each Turn_Phrase word for word', () => {
  expect(TURN_PHRASES).toEqual(TEMPLATES)
})

test('2.3: two mounts with one requestId draw the same text', async ($, on) => {
  on('ui.render', { component: 'TurnDuration' }, () => ({ type: 'Text', props: {}, children: ['engine line'] }))

  const props = { word: 'Baked', durationMs: 12000 }
  const ui = await $.ui.mount({ plugin: 'vn-spinner', surface: 'terminal', component: 'TurnDuration', requestId: 'line-1', props })

  const first = texts(await ui.drawn())

  expect(TEMPLATES.some(t => first.includes(t.replace('{t}', '12s')))).toBe(true)

  for (let i = 0; i < 20; i++) {
    await ui.redraw()
    expect(texts(await ui.drawn())).toBe(first)
  }
})

test('2.4: a throwing TurnDuration hook leaves the engine\'s line', async ($, on) => {
  on('ui.render', { component: 'TurnDuration' }, () => ({ type: 'Text', props: {}, children: ['engine line'] }))

  const props = { word: 'Baked', durationMs: Number.NaN }
  const ui = await $.ui.mount({ plugin: 'vn-spinner', surface: 'terminal', component: 'TurnDuration', requestId: 'line-2', props })

  expect(texts(await ui.drawn())).toContain('engine line')
})
