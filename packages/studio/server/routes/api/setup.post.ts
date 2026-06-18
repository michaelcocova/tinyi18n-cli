import type {
  TinyI18nEntryConfig,
  TinyI18nLocaleConfig,
  TinyI18nUserConfig,
} from '../../../../cli/src/core/config.ts'
import { defineEventHandler, readBody } from 'nitro/h3'
import { initWorkspace } from '../../../../cli/src/core/workspace.ts'
import { getProjectRoot } from '../../utils/project-root.ts'

function generateConfigSource(config: TinyI18nUserConfig): string {
  let code = `import { defineConfig } from "tinyi18n-cli";\n\n`
  code += `export default defineConfig({\n`
  code += `  filename: ${JSON.stringify(config.filename)},\n`

  code += `  locales: [\n`
  for (const locale of config.locales as TinyI18nLocaleConfig[]) {
    code += `    { code: ${JSON.stringify(locale.code)}, filename: ${JSON.stringify(locale.filename)} },\n`
  }
  code += `  ],\n`

  if (config.entries && config.entries.length > 0) {
    code += `  entries: [\n`
    for (const entry of config.entries as TinyI18nEntryConfig[]) {
      code += `    { dir: ${JSON.stringify(entry.dir)}, paths: ${JSON.stringify(entry.paths)} },\n`
    }
    code += `  ],\n`
  }

  code += `});\n`
  return code
}

export default defineEventHandler(async (event) => {
  const body = await readBody<unknown>(event)

  if (!body || typeof body !== 'object' || !('locales' in body)) {
    throw new Error('Invalid configuration data')
  }

  const configSource = generateConfigSource(body as TinyI18nUserConfig)
  const result = await initWorkspace(getProjectRoot(), configSource)

  return {
    success: true,
    created: result.created,
    workspaceDir: result.workspaceDir,
  }
})
