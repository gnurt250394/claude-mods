import type { BeeState } from '../types'
import { formatDuration } from './duration'

export function beeText(state: BeeState): string {
  switch (state.kind) {
    case 'Idle':
      return 'Rảnh quá, giao việc đi chứ 😴'
    case 'Working':
      return 'Đừng nhìn, ong đang tập trung 😤'
    case 'Sad':
      return state.cause === 'bash' ? `Lệnh fail: ${state.command} — code ai viết vậy 🤨` : 'API sập, đổ tại server cho nhanh'
    case 'Happy':
      return `${formatDuration(state.durationMs)} xong, nhanh hơn anh dev thật 😎`
  }
}
