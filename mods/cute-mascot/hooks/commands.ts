export type BeeFlags = { isHidden: boolean; isMuted: boolean }

type BeeReply = { flags: BeeFlags; text: string }

export const STORE_FAILED = 'Ong quên mất rồi, thử lại sau nhé'

const UNKNOWN = 'Ong không hiểu. Dùng: /bee, /bee hide, /bee mute, /bee unmute'

export function beeCommand(args: string, flags: BeeFlags): BeeReply {
  switch (args.trim()) {
    case '':
      return flags.isHidden
        ? { flags: { ...flags, isHidden: false }, text: 'Ong về rồi đây, nhớ ong à 🐝' }
        : { flags, text: 'Ong đang ở đây rồi' }
    case 'hide':
      return flags.isHidden
        ? { flags, text: 'Ong đi rồi mà, nhớ thì gõ /bee 🐝' }
        : { flags: { ...flags, isHidden: true }, text: 'Ong đi đây, có gì gõ /bee 😤' }
    case 'mute':
      return flags.isMuted
        ? { flags, text: 'Im re sẵn rồi, đừng bắt im nữa 🤐' }
        : { flags: { ...flags, isMuted: true }, text: 'Ong câm nín rồi đó 🤐' }
    case 'unmute':
      return flags.isMuted
        ? { flags: { ...flags, isMuted: false }, text: 'Ong lại được hó hé rồi 🔔' }
        : { flags, text: 'Đang kêu sẵn rồi, muốn ồn hơn à 🔔' }
    default:
      return { flags, text: UNKNOWN }
  }
}
