import { defineEventHandler } from 'nitro/h3'
import { readWorkspaceSnapshot } from '../../../../cli/src/core/workspace.ts'
import { getProjectRoot } from '../../utils/project-root.ts'

export default defineEventHandler(() =>
  readWorkspaceSnapshot(getProjectRoot()),
)
