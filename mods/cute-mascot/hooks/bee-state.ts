import type { BeeState } from '../types'
import { maskCommand } from './mask'

export type { BeeState }

export type BeeEvent =
  | { type: 'session-start' }
  | { type: 'turn-start' }
  | { type: 'tool-start'; agentId?: string }
  | { type: 'tool-end'; agentId?: string; isBashFailure: boolean; command?: string }
  | { type: 'turn-end'; agentId?: string; reason: 'answer' | 'aborted' | 'refusal' | 'error'; durationMs: number }

const IDLE: BeeState = { kind: 'Idle' }
const WORKING: BeeState = { kind: 'Working' }

/** The first matching row of the Bee_State table wins; an event with an `agentId` changes nothing. */
export function transition(state: BeeState, event: BeeEvent): BeeState {
  if ('agentId' in event && event.agentId !== undefined) {
    return state
  }

  switch (event.type) {
    case 'session-start':
      return IDLE
    case 'turn-start':
      return WORKING
    case 'tool-start':
      return state.kind === 'Sad' ? WORKING : state
    case 'tool-end':
      if (event.isBashFailure) {
        return { kind: 'Sad', cause: 'bash', command: maskCommand(event.command ?? '') }
      }

      return state.kind === 'Sad' ? WORKING : state
    case 'turn-end':
      if (event.reason === 'answer') {
        return { kind: 'Happy', durationMs: event.durationMs }
      }

      return event.reason === 'aborted' ? IDLE : { kind: 'Sad', cause: 'turn' }
  }
}
