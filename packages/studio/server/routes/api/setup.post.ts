import { defineEventHandler, readBody } from "nitro/h3";
import { initWorkspace } from "@tinyi18n/cli/src/core/workspace.ts";
import type {
  TinyI18nUserConfig,
  TinyI18nLocaleConfig,
  TinyI18nEntryConfig,
} from "@tinyi18n/cli/src/core/config.ts";
import { getProjectRoot } from "../../utils/project-root.ts";

function generateConfigSource(config: TinyI18nUserConfig): string {
  let code = `import { defineConfig } from "tinyi18n";\n\n`;
  code += `export default defineConfig({\n`;
  code += `  filename: ${JSON.stringify(config.filename)},\n`;

  code += `  locales: [\n`;
  for (const locale of config.locales as TinyI18nLocaleConfig[]) {
    code += `    { code: ${JSON.stringify(locale.code)}, filename: ${JSON.stringify(
      locale.filename,
    )}, label: ${JSON.stringify(locale.label)} },\n`;
  }
  code += `  ],\n`;

  if (config.entries && config.entries.length > 0) {
    code += `  entries: [\n`;
    for (const entry of config.entries as TinyI18nEntryConfig[]) {
      code += `    { dir: ${JSON.stringify(entry.dir)}, namespaces: ${JSON.stringify(
        entry.namespaces,
      )} },\n`;
    }
    code += `  ],\n`;
  }

  code += `});\n`;
  return code;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<TinyI18nUserConfig>(event);

  if (!body || !("locales" in body)) {
    throw new Error("Invalid configuration data");
  }

  const configSource = generateConfigSource(body);
  const result = await initWorkspace(getProjectRoot(), configSource);

  return {
    success: true,
    created: result.created,
    workspaceDir: result.workspaceDir,
  };
});
