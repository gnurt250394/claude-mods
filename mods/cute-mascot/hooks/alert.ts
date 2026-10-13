import { formatDuration } from './duration'

export type Alert = { sound: boolean; notification?: { title: 'Claude Code'; body: string } }

const LONG_TURN_MS = 120_000

export function alertFor(turn: { reason: string; durationMs: number; agentId?: string }, isMuted: boolean): Alert {
  const isSilent =
    isMuted || turn.agentId !== undefined || turn.durationMs <= LONG_TURN_MS || turn.reason === 'aborted'

  if (isSilent) {
    return { sound: false }
  }

  const label = turn.reason === 'answer' ? 'Xong' : 'Lỗi'

  return { sound: true, notification: { title: 'Claude Code', body: `${label} sau ${formatDuration(turn.durationMs)}` } }
}
