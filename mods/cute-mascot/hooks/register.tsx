import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { beeText } from './bee-text'
import { beeCommand } from './commands'
import { encodeCells, frameFor } from './sprite'

const bee = atom({ plugin: 'cute-mascot', key: 'bee' } as const, { kind: 'Idle' } as const)
const isHidden = atom({ plugin: 'cute-mascot', key: 'isHidden' } as const, false)
const isMuted = atom({ plugin: 'cute-mascot', key: 'isMuted' } as const, false)

const MIN_COLUMNS = 20
const SPRITE_WIDTH = 13

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await update($, bee, () => ({ kind: 'Idle' }) as const)
    await update($, isHidden, () => false)
    await update($, isMuted, () => false)
    await $.command.register({ name: 'bee', description: 'Show or hide the bee: /bee, /bee hide' })

    return next(e)
  })

  on('command.run', { command: 'bee' }, async ($, e) => {
    const flags = { isHidden: await read($, isHidden), isMuted: await read($, isMuted) }
    const reply = beeCommand(e.args, flags)
    await update($, isHidden, () => reply.flags.isHidden)

    return { text: reply.text }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const hidden = await read($, isHidden)

    if (hidden || e.surface !== 'terminal' || e.props.hasSurvey || e.props.bodyColumns < MIN_COLUMNS) {
      return next(e)
    }

    const state = await read($, bee)
    const { Box, Button, Raster, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" height={4}>
        <Raster key="bee" columns={12} rows={4} cells={encodeCells(frameFor(state.kind, 0, false))} />
        <Box flexDirection="column" marginLeft={1} width={e.props.bodyColumns - SPRITE_WIDTH}>
          <Text wrap="truncate-end">{beeText(state)}</Text>
          <Button key="hide" label="Đuổi ong 🐝" onPress={() => update($, isHidden, () => true)} />
        </Box>
      </Box>
    )
  })
}
