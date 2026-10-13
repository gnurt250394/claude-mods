export type BeeFlags = { isHidden: boolean; isMuted: boolean }

type BeeReply = { flags: BeeFlags; text: string }

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
    default:
      return { flags, text: UNKNOWN }
  }
}
