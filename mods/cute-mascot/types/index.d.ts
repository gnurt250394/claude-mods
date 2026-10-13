export type BeeState =
  | { kind: 'Idle' }
  | { kind: 'Working' }
  | { kind: 'Sad'; cause: 'bash'; command: string }
  | { kind: 'Sad'; cause: 'turn' }
  | { kind: 'Happy'; durationMs: number }

declare module 'claude-code' {
  interface PluginState {
    'cute-mascot': { bee: BeeState; isHidden: boolean; isMuted: boolean }
  }
}
