import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { tingWav } from '../mods/cute-mascot/hooks/ting.ts'

const target = fileURLToPath(new URL('../mods/cute-mascot/sounds/ting.wav', import.meta.url))
const wav = tingWav()

if (process.argv.includes('--check')) {
  const isSame = Buffer.compare(Buffer.from(wav), readFileSync(target)) === 0

  process.exit(isSame ? 0 : 1)
}

writeFileSync(target, wav)
