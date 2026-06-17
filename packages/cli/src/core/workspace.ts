import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import type {
  TinyI18nDataFile,
  TinyI18nItem,
  TinyI18nMessage,
  TinyI18nOperation,
  TinyI18nOperationResult,
  TinyI18nSnapshot,
} from "./message.ts";
import { resolveConfig, type TinyI18nResolvedConfig, type TinyI18nUserConfig } from "./config.ts";

const workspaceDir = ".tinyi18n";
const configFilename = "config.ts";
const legacyConfigFilename = "config";
const emptyConfig: TinyI18nResolvedConfig = {
  filename: ".data.json",
  locales: [],
};

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

async function pathExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

export interface InitWorkspaceResult {
  created: boolean;
  workspaceDir: string;
  configFile: string;
  dataFile: string;
}

const defaultConfigSource = `export default {
  locales: [
    { code: "zh-CN", filename: "zh-CN.json" },
  ],
  defaultLocale: "zh-CN",
};
`;

const defaultDataSource = `${JSON.stringify({ items: [] }, null, 2)}\n`;

export async function checkWorkspaceExists(projectRoot: string) {
  const targetWorkspaceDir = join(projectRoot, workspaceDir);
  const configFile = join(targetWorkspaceDir, configFilename);
  const dataFile = join(targetWorkspaceDir, emptyConfig.filename);

  if (
    (await pathExists(targetWorkspaceDir)) ||
    (await pathExists(configFile)) ||
    (await pathExists(join(targetWorkspaceDir, legacyConfigFilename))) ||
    (await pathExists(dataFile))
  ) {
    return {
      exists: true,
      workspaceDir: targetWorkspaceDir,
    };
  }

  return {
    exists: false,
    workspaceDir: targetWorkspaceDir,
  };
}

export async function initWorkspace(
  projectRoot: string,
  configSource?: string,
): Promise<InitWorkspaceResult> {
  const targetWorkspaceDir = join(projectRoot, workspaceDir);
  const configFile = join(targetWorkspaceDir, configFilename);
  const dataFile = join(targetWorkspaceDir, emptyConfig.filename);

  if (
    (await pathExists(targetWorkspaceDir)) ||
    (await pathExists(configFile)) ||
    (await pathExists(join(targetWorkspaceDir, legacyConfigFilename))) ||
    (await pathExists(dataFile))
  ) {
    return {
      created: false,
      workspaceDir: targetWorkspaceDir,
      configFile,
      dataFile,
    };
  }

  await mkdir(targetWorkspaceDir, { recursive: true });
  await writeFile(configFile, configSource ?? defaultConfigSource);
  await writeFile(dataFile, defaultDataSource);

  return {
    created: true,
    workspaceDir: targetWorkspaceDir,
    configFile,
    dataFile,
  };
}

async function resolveWorkspaceConfigFile(projectRoot: string) {
  const configFile = join(projectRoot, workspaceDir, configFilename);

  if (await pathExists(configFile)) {
    return {
      configFile,
      configExists: true,
    };
  }

  const legacyConfigFile = join(projectRoot, workspaceDir, legacyConfigFilename);

  if (await pathExists(legacyConfigFile)) {
    return {
      configFile: legacyConfigFile,
      configExists: true,
    };
  }

  return {
    configFile,
    configExists: false,
  };
}

function createEmptyWorkspaceSnapshot(
  projectRoot: string,
  dataFile: string,
  configFile: string,
  exists: boolean,
  configExists: boolean,
  error: string,
  configData: TinyI18nResolvedConfig | null,
  configError?: string,
): TinyI18nSnapshot {
  return {
    root: projectRoot,
    initialized: exists && configExists,
    config: configData ?? emptyConfig,
    languages: (configData ?? emptyConfig).locales.map((item) => item.code),
    items: [],
    error: error || configError,
  };
}

function parseWorkspaceConfigSource(source: string, configFile: string): TinyI18nUserConfig {
  const normalizedSource = source.replace(/^\uFEFF/, "").trim();
  const sourceWithoutImports = normalizedSource.replace(
    /^\s*import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*/gm,
    "",
  );
  const exportDefaultPrefix = "export default";

  if (!sourceWithoutImports.startsWith(exportDefaultPrefix)) {
    throw new Error(`Unsupported config format in ${configFile}`);
  }

  let expression = sourceWithoutImports.slice(exportDefaultPrefix.length).trim();

  if (expression.startsWith("defineConfig(") && expression.endsWith(");")) {
    expression = expression.slice("defineConfig(".length, -2).trim();
  } else if (expression.startsWith("defineConfig(") && expression.endsWith(")")) {
    expression = expression.slice("defineConfig(".length, -1).trim();
  } else if (expression.endsWith(";")) {
    expression = expression.slice(0, -1).trim();
  }

  return Function(`"use strict"; return (${expression});`)() as TinyI18nUserConfig;
}

async function readConfigData(configFile: string, configExists: boolean) {
  if (!configExists) {
    return { config: null };
  }

  try {
    const source = await readFile(configFile, "utf8");
    const userConfig = parseWorkspaceConfigSource(source, configFile) as
      | TinyI18nUserConfig
      | TinyI18nResolvedConfig;
    const config = resolveConfig(userConfig);

    return { config };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return { config: null, configError: message };
  }
}

function resolveWorkspaceDataFile(projectRoot: string, configData?: TinyI18nResolvedConfig | null) {
  return join(projectRoot, workspaceDir, configData?.filename ?? emptyConfig.filename);
}

function normalizeDataFile(data: unknown): TinyI18nDataFile {
  if (Array.isArray(data)) {
    return { items: data as TinyI18nItem[] };
  }

  if (data && typeof data === "object" && Array.isArray((data as TinyI18nDataFile).items)) {
    return data as TinyI18nDataFile;
  }

  return { items: [] };
}

async function openWorkspaceData(projectRoot: string) {
  const { configFile, configExists } = await resolveWorkspaceConfigFile(projectRoot);
  const { config } = await readConfigData(configFile, configExists);
  const dataFile = resolveWorkspaceDataFile(projectRoot, config);

  await mkdir(join(projectRoot, workspaceDir), { recursive: true });

  const db = new Low<TinyI18nDataFile>(new JSONFile<TinyI18nDataFile>(dataFile), {
    items: [],
  });

  await db.read();
  db.data = normalizeDataFile(db.data);

  return {
    dataFile,
    db,
  };
}

function collectDescendantIds(items: TinyI18nItem[], ids: Iterable<string>) {
  const removedIds = new Set(ids);
  let changed = true;

  while (changed) {
    changed = false;

    for (const item of items) {
      if (!item.parent || removedIds.has(item.id)) {
        continue;
      }

      if (removedIds.has(item.parent)) {
        removedIds.add(item.id);
        changed = true;
      }
    }
  }

  return removedIds;
}

function applyOperation(items: TinyI18nItem[], operation: TinyI18nOperation) {
  if (operation.type === "create") {
    return [...items, operation.data];
  }

  if (operation.type === "update") {
    return items.map((item) => {
      if (item.id !== operation.data.id) {
        return item;
      }

      if (item.type === "message") {
        return {
          ...item,
          ...operation.data.patch,
          translations: {
            ...item.translations,
            ...(operation.data.patch as Partial<TinyI18nMessage>).translations,
          },
        } as TinyI18nItem;
      }

      return {
        ...item,
        ...operation.data.patch,
      } as TinyI18nItem;
    });
  }

  if (operation.type === "delete") {
    const removedIds = collectDescendantIds(items, operation.data.ids);

    return items.filter((item) => !removedIds.has(item.id));
  }

  const movingIds = collectDescendantIds(items, operation.data.ids);

  if (operation.data.parent && movingIds.has(operation.data.parent)) {
    return items;
  }

  return items.map((item) => {
    if (!operation.data.ids.includes(item.id)) {
      return item;
    }

    return {
      ...item,
      parent: operation.data.parent,
    };
  });
}

export async function readWorkspaceSnapshot(projectRoot: string): Promise<TinyI18nSnapshot> {
  const { configFile, configExists } = await resolveWorkspaceConfigFile(projectRoot);
  const { config, configError } = await readConfigData(configFile, configExists);
  const dataFile = resolveWorkspaceDataFile(projectRoot, config);
  const exists = await pathExists(dataFile);

  if (!exists) {
    return createEmptyWorkspaceSnapshot(
      projectRoot,
      dataFile,
      configFile,
      false,
      configExists,
      `Missing ${workspaceDir}/${config?.filename ?? emptyConfig.filename}`,
      config,
      configError,
    );
  }

  try {
    const data = normalizeDataFile(JSON.parse(await readFile(dataFile, "utf8")));

    return {
      root: projectRoot,
      initialized: exists && configExists,
      config: config ?? emptyConfig,
      languages: (config ?? emptyConfig).locales.map((item) => item.code),
      items: data.items,
      error: configError,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return createEmptyWorkspaceSnapshot(
      projectRoot,
      dataFile,
      configFile,
      true,
      configExists,
      `Failed to parse JSON from ${workspaceDir}/${config?.filename ?? emptyConfig.filename}: ${message}`,
      config,
      configError,
    );
  }
}

export async function applyWorkspaceOperation(
  projectRoot: string,
  operation: TinyI18nOperation | TinyI18nOperation[],
): Promise<TinyI18nOperationResult> {
  const { db } = await openWorkspaceData(projectRoot);
  const operations = Array.isArray(operation) ? operation : [operation];

  db.data.items = operations.reduce(
    (items, currentOperation) => applyOperation(items, currentOperation),
    db.data.items,
  );
  await db.write();

  return {
    ok: true,
    operation,
  };
}
