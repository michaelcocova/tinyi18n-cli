import type { TinyI18nResolvedConfig, TinyI18nUserConfig } from './config.ts'
import type {
  TinyI18nDataFile,
  TinyI18nItem,
  TinyI18nMessage,
  TinyI18nOperation,
  TinyI18nOperationResult,
  TinyI18nSnapshot,
} from './message.ts'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createJiti } from 'jiti'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { resolveConfig } from './config.ts'

const workspaceDir = '.tinyi18n'
const configFilename = 'config.ts'
const legacyConfigFilename = 'config'
const jiti = createJiti(import.meta.url, { interopDefault: true })
const emptyConfig: TinyI18nResolvedConfig = {
  filename: '.data.json',
  locales: [],
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

async function pathExists(path: string) {
  try {
    await stat(path)
    return true
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return false
    }

    throw error
  }
}

export interface InitWorkspaceResult {
  created: boolean
  workspaceDir: string
  configFile: string
  dataFile: string
}

const defaultConfigSource = `export default {
  locales: [
    { code: "zh-CN", filename: "zh-CN.json" },
  ],
  defaultLocale: "zh-CN",
};
`

const defaultDataSource = `${JSON.stringify({ items: [] }, null, 2)}\n`

export async function checkWorkspaceExists(projectRoot: string) {
  const targetWorkspaceDir = join(projectRoot, workspaceDir)
  const configFile = join(targetWorkspaceDir, configFilename)
  const dataFile = join(targetWorkspaceDir, emptyConfig.filename)

  if (
    (await pathExists(targetWorkspaceDir))
    || (await pathExists(configFile))
    || (await pathExists(join(targetWorkspaceDir, legacyConfigFilename)))
    || (await pathExists(dataFile))
  ) {
    return {
      exists: true,
      workspaceDir: targetWorkspaceDir,
    }
  }

  return {
    exists: false,
    workspaceDir: targetWorkspaceDir,
  }
}

export async function initWorkspace(
  projectRoot: string,
  configSource?: string,
): Promise<InitWorkspaceResult> {
  const targetWorkspaceDir = join(projectRoot, workspaceDir)
  const configFile = join(targetWorkspaceDir, configFilename)
  const dataFile = join(targetWorkspaceDir, emptyConfig.filename)

  if (
    (await pathExists(targetWorkspaceDir))
    || (await pathExists(configFile))
    || (await pathExists(join(targetWorkspaceDir, legacyConfigFilename)))
    || (await pathExists(dataFile))
  ) {
    return {
      created: false,
      workspaceDir: targetWorkspaceDir,
      configFile,
      dataFile,
    }
  }

  await mkdir(targetWorkspaceDir, { recursive: true })
  await writeFile(configFile, configSource ?? defaultConfigSource)
  await writeFile(dataFile, defaultDataSource)

  return {
    created: true,
    workspaceDir: targetWorkspaceDir,
    configFile,
    dataFile,
  }
}

async function resolveWorkspaceConfigFile(projectRoot: string) {
  const configFile = join(projectRoot, workspaceDir, configFilename)

  if (await pathExists(configFile)) {
    return {
      configFile,
      configExists: true,
    }
  }

  const legacyConfigFile = join(
    projectRoot,
    workspaceDir,
    legacyConfigFilename,
  )

  if (await pathExists(legacyConfigFile)) {
    return {
      configFile: legacyConfigFile,
      configExists: true,
    }
  }

  return {
    configFile,
    configExists: false,
  }
}

function createEmptyWorkspaceSnapshot(
  projectRoot: string,
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
    languages: (configData ?? emptyConfig).locales.map(item => item.code),
    items: [],
    error: error || configError,
  }
}

async function loadWorkspaceConfigModule(
  configFile: string,
): Promise<TinyI18nUserConfig> {
  const config = await jiti.import(configFile, { default: true })

  if (!config || typeof config !== 'object') {
    throw new Error(`Unsupported config format in ${configFile}`)
  }

  return config as TinyI18nUserConfig
}

async function readConfigData(configFile: string, configExists: boolean) {
  if (!configExists) {
    return { config: null }
  }

  try {
    const userConfig = (await loadWorkspaceConfigModule(configFile)) as
      | TinyI18nUserConfig
      | TinyI18nResolvedConfig
    const config = resolveConfig(userConfig)

    return { config }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return { config: null, configError: message }
  }
}

function resolveWorkspaceDataFile(
  projectRoot: string,
  configData?: TinyI18nResolvedConfig | null,
) {
  return join(
    projectRoot,
    workspaceDir,
    configData?.filename ?? emptyConfig.filename,
  )
}

function normalizeDataFile(data: unknown): TinyI18nDataFile {
  if (Array.isArray(data)) {
    return { items: data as TinyI18nItem[], trash: [] }
  }

  if (
    data
    && typeof data === 'object'
    && Array.isArray((data as TinyI18nDataFile).items)
  ) {
    return {
      items: (data as TinyI18nDataFile).items,
      trash: (data as TinyI18nDataFile).trash || [],
    } as TinyI18nDataFile
  }

  return { items: [], trash: [] }
}

/**
 * 统一补齐/归一化 index（升序、连续）：
 * - 背景：历史数据里 `index` 可能缺失，导致「删除后马上撤销」时，restore 的排序无法恢复到原位置
 * - 策略：按当前结构的「index 升序（缺失视为 0）+ 原数组顺序」排序，然后把同层级 index 归一化为 0..n-1
 * - 说明：这里会重写 index 的数值，但不会改变原有显示顺序（只让排序更稳定）
 */
function normalizeIndexes(items: TinyI18nItem[]): { items: TinyI18nItem[], changed: boolean } {
  const byId = new Map(items.map(item => [item.id, item]))
  const position = new Map(items.map((item, i) => [item.id, i]))
  const childIdsByParent = new Map<string, string[]>()
  let changed = false

  for (const item of items) {
    if (!item.parent)
      continue
    const bucket = childIdsByParent.get(item.parent) ?? []
    bucket.push(item.id)
    childIdsByParent.set(item.parent, bucket)
  }

  function getIndex(id: string) {
    const idx = byId.get(id)?.index
    return typeof idx === 'number' ? idx : 0
  }
  function getPos(id: string) {
    return position.get(id) ?? 0
  }

  // roots：parent 缺失或 parent 不存在的节点
  const rootIds = items
    .filter(item => !item.parent || !byId.has(item.parent))
    .map(item => item.id)
    .sort((a, b) => {
      const diff = getIndex(a) - getIndex(b)
      return diff !== 0 ? diff : getPos(a) - getPos(b)
    })

  // 对某个 parent 的 children 做排序并重排 index
  function normalizeChildren(parentId?: string) {
    const ids = parentId ? (childIdsByParent.get(parentId) ?? []) : rootIds
    const sortedIds = [...ids].sort((a, b) => {
      const diff = getIndex(a) - getIndex(b)
      return diff !== 0 ? diff : getPos(a) - getPos(b)
    })

    for (let i = 0; i < sortedIds.length; i++) {
      const item = byId.get(sortedIds[i])
      if (!item)
        continue
      if (item.index !== i) {
        item.index = i
        changed = true
      }
    }

    // 递归处理下一层
    for (const id of sortedIds) {
      normalizeChildren(id)
    }
  }

  normalizeChildren()

  // 注意：这里返回原数组引用即可（item 被原地更新），避免额外拷贝
  return { items, changed }
}

async function openWorkspaceData(projectRoot: string) {
  const { configFile, configExists }
    = await resolveWorkspaceConfigFile(projectRoot)
  const { config } = await readConfigData(configFile, configExists)
  const dataFile = resolveWorkspaceDataFile(projectRoot, config)

  await mkdir(join(projectRoot, workspaceDir), { recursive: true })

  const db = new Low<TinyI18nDataFile>(
    new JSONFile<TinyI18nDataFile>(dataFile),
    {
      items: [],
    },
  )

  await db.read()
  db.data = normalizeDataFile(db.data)

  // 迁移：补齐/归一化 index，并写回磁盘，保证后续 delete/restore 的排序可逆
  if (db.data) {
    const itemsNormalized = normalizeIndexes(db.data.items ?? [])
    const trashNormalized = normalizeIndexes(db.data.trash ?? [])
    if (itemsNormalized.changed || trashNormalized.changed) {
      db.data = {
        ...db.data,
        items: itemsNormalized.items,
        trash: trashNormalized.items,
      }
      await db.write()
    }
  }

  return {
    dataFile,
    db,
  }
}

function collectDescendantIds(items: TinyI18nItem[], ids: Iterable<string>) {
  const collectedIds = new Set(ids)
  let changed = true

  while (changed) {
    changed = false

    for (const item of items) {
      if (!item.parent || collectedIds.has(item.id)) {
        continue
      }

      if (collectedIds.has(item.parent)) {
        collectedIds.add(item.id)
        changed = true
      }
    }
  }

  return collectedIds
}

function sortItemsByIndexAndParent(items: TinyI18nItem[]): TinyI18nItem[] {
  const itemsById = new Map(items.map(item => [item.id, item]))
  const childIdsByParent = new Map<string, string[]>()

  for (const item of items) {
    if (!item.parent)
      continue
    const childIds = childIdsByParent.get(item.parent) ?? []
    childIds.push(item.id)
    childIdsByParent.set(item.parent, childIds)
  }

  const sorted: TinyI18nItem[] = []

  function flatten(id: string) {
    const item = itemsById.get(id)
    if (!item)
      return
    sorted.push(item)

    const children = (childIdsByParent.get(id) ?? [])
      .map(childId => itemsById.get(childId))
      .filter((child): child is TinyI18nItem => Boolean(child))
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))

    for (const child of children) {
      flatten(child.id)
    }
  }

  const roots = items
    .filter(item => !item.parent || !itemsById.has(item.parent))
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))

  for (const root of roots) {
    flatten(root.id)
  }

  return sorted
}

function applyOperation(data: TinyI18nDataFile, operation: TinyI18nOperation): TinyI18nDataFile {
  const { items, trash = [] } = data

  if (operation.type === 'create') {
    return { ...data, items: [...items, operation.data] }
  }

  if (operation.type === 'update') {
    return {
      ...data,
      items: items.map((item) => {
        if (item.id !== operation.data.id) {
          return item
        }

        if (item.type === 'message') {
          return {
            ...item,
            ...operation.data.patch,
            translations: {
              ...item.translations,
              ...(operation.data.patch as Partial<TinyI18nMessage>).translations,
            },
          } as TinyI18nItem
        }

        return {
          ...item,
          ...operation.data.patch,
        } as TinyI18nItem
      }),
    }
  }

  if (operation.type === 'delete') {
    const removedIds = collectDescendantIds(items, operation.data.ids)
    const removedItems = items.filter(item => removedIds.has(item.id))

    return {
      ...data,
      items: items.filter(item => !removedIds.has(item.id)),
      trash: [...trash, ...removedItems],
    }
  }

  if (operation.type === 'restore') {
    const restoredIds = collectDescendantIds(trash, operation.data.ids)

    const restoredItems = trash.filter(item => restoredIds.has(item.id))

    const nextItems = [...items, ...restoredItems]

    return {
      ...data,
      items: sortItemsByIndexAndParent(nextItems),
      trash: trash.filter(item => !restoredIds.has(item.id)),
    }
  }

  if (operation.type === 'permanent_delete') {
    const permanentlyDeletedIds = collectDescendantIds(trash, operation.data.ids)
    return {
      ...data,
      trash: trash.filter(item => !permanentlyDeletedIds.has(item.id)),
    }
  }

  const movingIds = collectDescendantIds(items, operation.data.ids)

  if (operation.data.parent && movingIds.has(operation.data.parent)) {
    return data
  }

  return {
    ...data,
    items: items.map((item) => {
      if (!operation.data.ids.includes(item.id)) {
        return item
      }

      return {
        ...item,
        parent: operation.data.parent,
      }
    }),
  }
}

export async function readWorkspaceSnapshot(
  projectRoot: string,
): Promise<TinyI18nSnapshot> {
  const { configFile, configExists }
    = await resolveWorkspaceConfigFile(projectRoot)
  const { config, configError } = await readConfigData(
    configFile,
    configExists,
  )
  const dataFile = resolveWorkspaceDataFile(projectRoot, config)
  const exists = await pathExists(dataFile)

  if (!exists) {
    return createEmptyWorkspaceSnapshot(
      projectRoot,
      false,
      configExists,
      `Missing ${workspaceDir}/${config?.filename ?? emptyConfig.filename}`,
      config,
      configError,
    )
  }

  try {
    const data = normalizeDataFile(
      JSON.parse(await readFile(dataFile, 'utf8')),
    )

    return {
      root: projectRoot,
      initialized: exists && configExists,
      config: config ?? emptyConfig,
      languages: (config ?? emptyConfig).locales.map(item => item.code),
      items: data.items,
      error: configError,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return createEmptyWorkspaceSnapshot(
      projectRoot,
      true,
      configExists,
      `Failed to parse JSON from ${workspaceDir}/${config?.filename ?? emptyConfig.filename}: ${message}`,
      config,
      configError,
    )
  }
}

export async function readWorkspaceTrash(
  projectRoot: string,
): Promise<{ items: TinyI18nItem[] }> {
  const { db } = await openWorkspaceData(projectRoot)
  return {
    items: db.data.trash || [],
  }
}

export async function applyWorkspaceOperation(
  projectRoot: string,
  operation: TinyI18nOperation | TinyI18nOperation[],
): Promise<TinyI18nOperationResult> {
  const { db } = await openWorkspaceData(projectRoot)
  const operations = Array.isArray(operation) ? operation : [operation]

  db.data = operations.reduce(
    (data, currentOperation) => applyOperation(data, currentOperation),
    db.data,
  )
  await db.write()

  return {
    ok: true,
    operation,
  }
}
