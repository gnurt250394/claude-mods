import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { BeeEvent, BeeState } from './bee-state'
import { transition } from './bee-state'
import { beeText } from './bee-text'
import { beeCommand } from './commands'
import { encodeCells, frameFor } from './sprite'

const bee = atom({ plugin: 'cute-mascot', key: 'bee' } as const, { kind: 'Idle' } as BeeState)
const isHidden = atom({ plugin: 'cute-mascot', key: 'isHidden' } as const, false)
const isMuted = atom({ plugin: 'cute-mascot', key: 'isMuted' } as const, false)

const MIN_COLUMNS = 20
const SPRITE_WIDTH = 13
const FRAME_INTERVAL_MS = 250
const SITE_KEY = 'bee'

let siteId: string | undefined
let tick = 0
let isReducedMotion = false

const commandOf = (input: unknown): string | undefined => {
  const command = (input as { command?: unknown } | null)?.command

  return typeof command === 'string' ? command : undefined
}

function apply($: EngineInterface, event: BeeEvent) {
  return update($, bee, state => transition(state, event))
}

async function readReducedMotion($: EngineInterface) {
  try {
    isReducedMotion = (await $.settings.read()).prefersReducedMotion === true
  } catch {
    isReducedMotion = false
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await apply($, { type: 'session-start' })
    await update($, isHidden, () => false)
    await update($, isMuted, () => false)
    await readReducedMotion($)
    await $.command.register({ name: 'bee', description: 'Show or hide the bee: /bee, /bee hide' })

    $.clock.every(FRAME_INTERVAL_MS, async () => {
      const state = await read($, bee)

      if (siteId === undefined || isReducedMotion || (state.kind !== 'Working' && state.kind !== 'Happy')) {
        return
      }

      tick += 1
      await $.ui.blit({
        requestId: siteId,
        key: SITE_KEY,
        cells: encodeCells(frameFor(state.kind, tick, isReducedMotion)),
      })
    })

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    await apply($, { type: 'turn-start' })
    await readReducedMotion($)

    return next(e)
  })

  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)

    if (verdict.decision === 'allow' && e.tool_use_id !== undefined) {
      await apply($, { type: 'tool-start', agentId: e.agentId })
    }

    return verdict
  }).catch(($, e, next) => next(e))

  on('classic.PostToolUse', async ($, e, next) => {
    await apply($, { type: 'tool-end', isBashFailure: false, agentId: e.agent_id })

    return next(e)
  }).catch(($, e, next) => next(e))

  on('classic.PostToolUseFailure', async ($, e, next) => {
    const isBashFailure = e.tool_name === 'Bash' && e.is_interrupt !== true

    await apply($, {
      type: 'tool-end',
      isBashFailure,
      command: commandOf(e.tool_input),
      agentId: e.agent_id,
    })

    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    await apply($, { type: 'turn-end', reason: e.reason, durationMs: e.durationMs, agentId: e.agentId })

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

    siteId = e.requestId
    const state = await read($, bee)
    const { Box, Button, Raster, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" height={4}>
        <Raster
          key={SITE_KEY}
          columns={12}
          rows={4}
          cells={encodeCells(frameFor(state.kind, tick, isReducedMotion))}
        />
        <Box flexDirection="column" marginLeft={1} width={e.props.bodyColumns - SPRITE_WIDTH}>
          <Text wrap="truncate-end">{beeText(state)}</Text>
          <Button key="hide" label="Đuổi ong 🐝" onPress={() => update($, isHidden, () => true)} />
        </Box>
      </Box>
    )
  })
}
