import { expect, test } from 'claude-code/testing'

import { PHRASES } from '../hooks/phrases'

const EXPECTED = {
  thinking: ['🤔', ['Đang vò đầu bứt tai', 'Đang nghĩ nát óc', 'Đang hỏi ý kiến con ong', 'Đang nhâm nhi trà đá']],
  requesting: ['📡', ['Đang gọi tổng đài', 'Đang thả bồ câu đưa thư', 'Đang chờ wifi công ty', 'Đang kết nối vũ trụ']],
  responding: ['✍️', ['Đang múa bút', 'Đang gõ lạch cạch', 'Đang viết như gió', 'Đang bịa văn mẫu']],
  'tool-input': ['🧰', ['Đang xắn tay áo', 'Đang lục hộp đồ nghề', 'Đang tìm cờ lê số 10', 'Đang đọc hướng dẫn']],
  'tool-use': ['🔧', ['Đang vặn ốc', 'Đang làm hì hục', 'Đang đổ mồ hôi', 'Đang sửa cái ai đó làm hỏng']],
} as const

type Mode = keyof typeof EXPECTED

const MODES = Object.keys(EXPECTED) as Mode[]

test('1.1: each Phrase_List word for word', () => {
  for (const mode of MODES) {
    const [emoji, phrases] = EXPECTED[mode]
    expect(PHRASES[mode]).toEqual({ emoji, phrases })
  }
})

async function drawSpinner(on: any, $: any, props: Record<string, unknown>) {
  let seen: any
  on('ui.render', { component: 'Spinner' }, (_$: any, e: any) => {
    seen = e.props

    return { type: 'Text', props: {}, children: [e.props.word] }
  })
  await $.ui.mount({ plugin: 'vn-spinner', surface: 'terminal', component: 'Spinner', props })

  return seen
}

test('1.1 1.5: the Spinner hook keeps message and suffix', async ($, on) => {
  const props = { word: 'Sauteing', message: 'Compacting', suffix: '…', mode: 'thinking' }
  const seen = await drawSpinner(on, $, props)

  expect(seen.message).toBe('Compacting')
  expect(seen.suffix).toBe('…')
  expect(seen.mode).toBe('thinking')
  expect(seen.word.startsWith('🤔 ')).toBe(true)
  expect(EXPECTED.thinking[1].map(p => `🤔 ${p}`)).toContain(seen.word)
})

test('1.4: an unknown Mode keeps word', async ($, on) => {
  const props = { word: 'Sauteing', message: null, suffix: '…', mode: 'dreaming' }
  const seen = await drawSpinner(on, $, props)

  expect(seen.word).toBe('Sauteing')
})
