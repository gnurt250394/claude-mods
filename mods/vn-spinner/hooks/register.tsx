import type { Register } from 'claude-code'

import { formatDuration } from './duration'
import { TURN_PHRASES, pick, remember, spinnerWord } from './phrases'

let pickTable: Readonly<Record<string, string>> = {}
let lineTable: Readonly<Record<string, string>> = {}

export const register: Register = on => {
  on('turn.start', ($, e, next) => {
    pickTable = {}

    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, ($, e, next) => {
    const { mode } = e.props
    const first = spinnerWord(mode, Math.random())

    if (first === undefined) {
      return next(e)
    }

    const picked = remember(pickTable, mode, () => first)
    pickTable = picked.table

    return next({ ...e, props: { ...e.props, word: picked.value } })
  })

  on('ui.render', { component: 'TurnDuration' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    const duration = formatDuration(e.props.durationMs)
    const picked = remember(lineTable, e.requestId, () => pick(TURN_PHRASES, Math.random()))
    lineTable = picked.table

    return <Text dimColor>{picked.value.replace('{t}', duration)}</Text>
  })
}
