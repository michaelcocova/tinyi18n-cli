import antfu from '@antfu/eslint-config'
import { cliLinter, sharedLinter, studioLinter, typingsLinter } from './eslint'

export default antfu(
  {
    vue: true,
    markdown: true,
  },
  // Shared
  sharedLinter,
  // CLI
  cliLinter,
  // Studio
  studioLinter,
  // Typings
  typingsLinter,
)
