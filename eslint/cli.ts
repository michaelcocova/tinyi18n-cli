import type { Linter } from 'eslint'

export const cliLinter: Linter.Config = {
  files: ['packages/cli/**/*.{js,mjs,cjs,ts,mts,cts}'],
  rules: {
    'no-console': 'off',
    // 要求显式 import { Buffer } from 'node:buffer'
    'n/prefer-global/buffer': 'error',
    'n/prefer-global/process': 'error',
  },
}
