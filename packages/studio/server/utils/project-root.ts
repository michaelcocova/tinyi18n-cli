import { cwd, env } from 'node:process'

export function getProjectRoot() {
  return env.TINYI18N_PROJECT_ROOT ?? cwd()
}
