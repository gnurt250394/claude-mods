export type Mode = 'thinking' | 'requesting' | 'responding' | 'tool-input' | 'tool-use'

export const PHRASES: Readonly<Record<Mode, { emoji: string; phrases: readonly string[] }>> = {
  thinking: {
    emoji: '🤔',
    phrases: ['Đang vò đầu bứt tai', 'Đang nghĩ nát óc', 'Đang hỏi ý kiến con ong', 'Đang nhâm nhi trà đá'],
  },
  requesting: {
    emoji: '📡',
    phrases: ['Đang gọi tổng đài', 'Đang thả bồ câu đưa thư', 'Đang chờ wifi công ty', 'Đang kết nối vũ trụ'],
  },
  responding: {
    emoji: '✍️',
    phrases: ['Đang múa bút', 'Đang gõ lạch cạch', 'Đang viết như gió', 'Đang bịa văn mẫu'],
  },
  'tool-input': {
    emoji: '🧰',
    phrases: ['Đang xắn tay áo', 'Đang lục hộp đồ nghề', 'Đang tìm cờ lê số 10', 'Đang đọc hướng dẫn'],
  },
  'tool-use': {
    emoji: '🔧',
    phrases: ['Đang vặn ốc', 'Đang làm hì hục', 'Đang đổ mồ hôi', 'Đang sửa cái ai đó làm hỏng'],
  },
}

const isMode = (mode: string): mode is Mode => Object.hasOwn(PHRASES, mode)

/** Item `i` owns the interval `[i / n, (i + 1) / n)` of `r`, with `r` in [0, 1). */
export function pick<T>(items: readonly T[], r: number): T {
  return items[Math.floor(r * items.length)]
}

export function spinnerWord(mode: string, r: number): string | undefined {
  if (!isMode(mode)) {
    return undefined
  }

  const { emoji, phrases } = PHRASES[mode]

  return `${emoji} ${pick(phrases, r)}`
}

export function remember(
  table: Readonly<Record<string, string>>,
  key: string,
  make: () => string,
): { table: Readonly<Record<string, string>>; value: string } {
  if (Object.hasOwn(table, key)) {
    return { table, value: table[key] }
  }

  const value = make()

  return { table: { ...table, [key]: value }, value }
}

export const TURN_PHRASES: readonly string[] = [
  '🎉 Đã cày xong sau {t}',
  '😎 Ngon lành sau {t}',
  '🐝 Ong về tổ sau {t}',
  '🥵 Vật vã {t} mới xong',
]
