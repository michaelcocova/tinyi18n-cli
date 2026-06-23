import type {
  TinyI18nItem,
  TinyI18nMessage,
  TinyI18nOperation,
  TinyI18nOperationResult,
  TinyI18nSnapshot,
} from '../../../../cli/src/core/message.ts'
import { createGlobalState } from '@vueuse/core'
import { computed, ref } from 'vue'
import { getWebConfig } from '../../web-config.ts'

/**
 * 收集 ids 对应节点的所有后代 id（含自身）。
 * 说明：这里用「关系闭包」的方式做，不依赖 tree cache，保证对原始 items 也可用。
 */
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

function applyOperationToItems(items: TinyI18nItem[], operation: TinyI18nOperation) {
  if (operation.type === 'create') {
    return [...items, operation.data]
  }

  if (operation.type === 'update') {
    return items.map((item) => {
      if (item.id !== operation.data.id) {
        return item
      }

      // message: translations 要做深合并，避免覆盖其它语言
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
    })
  }

  if (operation.type === 'delete') {
    const removedIds = collectDescendantIds(items, operation.data.ids)
    return items.filter(item => !removedIds.has(item.id))
  }

  if (operation.type === 'move') {
    const movingIds = collectDescendantIds(items, operation.data.ids)
    // 禁止移动到自身后代节点下（会产生环）
    if (operation.data.parent && movingIds.has(operation.data.parent)) {
      return items
    }

    return items.map((item) => {
      if (!operation.data.ids.includes(item.id)) {
        return item
      }

      return {
        ...item,
        parent: operation.data.parent,
      }
    })
  }

  // restore / permanent_delete：属于「跨集合」操作，通常需要 reload 来确保一致性
  return items
}

function applyOperationsToItems(
  items: TinyI18nItem[],
  operations: TinyI18nOperation | TinyI18nOperation[],
) {
  const nextOps = Array.isArray(operations) ? operations : [operations]
  return nextOps.reduce(applyOperationToItems, items)
}

function applyTrashLocalOperation(items: TinyI18nItem[], operations: TinyI18nOperation | TinyI18nOperation[]) {
  const nextOps = Array.isArray(operations) ? operations : [operations]
  let nextItems = [...items]

  for (const op of nextOps) {
    if (op.type === 'restore' || op.type === 'permanent_delete') {
      const idsToRemove = collectDescendantIds(nextItems, op.data.ids)
      nextItems = nextItems.filter(item => !idsToRemove.has(item.id))
    }
  }

  return nextItems
}

/**
 * 数据请求中心：
 * 1) 从 server 拉取 workspace snapshot（config + items）
 * 2) 从 server 拉取 trash 列表
 * 3) 统一提供 commit(operation) 能力，并维护本地状态
 */
export const useDataCenter = createGlobalState(() => {
  const webConfig = getWebConfig()

  // 主文档（/data）
  const snapshot = ref<TinyI18nSnapshot>()
  const items = ref<TinyI18nItem[]>([])
  const isLoading = ref(false)
  const hasLoaded = ref(false)
  const error = ref('')
  let pendingRequest: Promise<void> | null = null

  // 回收站（/trash）
  const trash = ref<TinyI18nItem[]>([])
  const isTrashLoading = ref(false)
  const hasTrashLoaded = ref(false)
  const trashError = ref('')
  let pendingTrashRequest: Promise<void> | null = null

  async function load(force = false) {
    if (pendingRequest && !force) {
      return pendingRequest
    }

    pendingRequest = (async () => {
      isLoading.value = true
      error.value = ''

      try {
        const response = await fetch(`${webConfig.apiBase}/data`)
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`)
        }

        const nextSnapshot = (await response.json()) as TinyI18nSnapshot
        snapshot.value = nextSnapshot
        items.value = nextSnapshot.items ?? []
        error.value = nextSnapshot.error ?? ''
        hasLoaded.value = true
      }
      catch (loadError) {
        error.value = loadError instanceof Error ? loadError.message : String(loadError)
      }
      finally {
        isLoading.value = false
        pendingRequest = null
      }
    })()

    return pendingRequest
  }

  async function loadTrash(force = false) {
    if (pendingTrashRequest && !force) {
      return pendingTrashRequest
    }

    pendingTrashRequest = (async () => {
      isTrashLoading.value = true
      trashError.value = ''

      try {
        const response = await fetch(`${webConfig.apiBase}/trash`)
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`)
        }

        const data = await response.json()
        trash.value = data.items || []
        hasTrashLoaded.value = true
      }
      catch (loadError) {
        trashError.value = loadError instanceof Error ? loadError.message : String(loadError)
      }
      finally {
        isTrashLoading.value = false
        pendingTrashRequest = null
      }
    })()

    return pendingTrashRequest
  }

  async function ensureLoaded() {
    if (!hasLoaded.value) {
      await load()
    }
  }
  async function ensureTrashLoaded() {
    if (!hasTrashLoaded.value) {
      await loadTrash()
    }
  }

  /**
   * 只做本地应用，不发请求。
   * 用途：
   * - 输入组件的即时回显（配合 save queue）
   */
  async function applyLocalOperation(operation: TinyI18nOperation | TinyI18nOperation[]) {
    await ensureLoaded()
    const nextItems = applyOperationsToItems(items.value, operation)
    items.value = nextItems

    if (snapshot.value) {
      snapshot.value = { ...snapshot.value, items: nextItems }
    }
  }

  /**
   * 向 server 提交 operation，并将返回的 operation 应用到本地状态。
   * 说明：
   * - server 会进行最终裁决（例如 restore 可能影响 items 与 trash），因此部分操作我们直接 reload 来确保一致性。
   */
  async function commit(operation: TinyI18nOperation | TinyI18nOperation[]) {
    await ensureLoaded()

    isLoading.value = true
    error.value = ''

    try {
      const response = await fetch(`${webConfig.apiBase}/data/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation),
      })

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }

      const result = (await response.json()) as TinyI18nOperationResult
      const ops = Array.isArray(operation) ? operation : [operation]

      const hasRestore = ops.some(op => op.type === 'restore')
      const hasDelete = ops.some(op => op.type === 'delete')
      const hasPermanentDelete = ops.some(op => op.type === 'permanent_delete')

      // restore：为了安全起见，直接全量刷新（主文档 + trash）
      if (hasRestore) {
        await Promise.all([load(true), loadTrash(true)])
      }
      else {
        // 主文档增量更新
        items.value = applyOperationsToItems(items.value, result.operation)
        if (snapshot.value) {
          snapshot.value = { ...snapshot.value, items: items.value }
        }

        // delete：主文档已删，但 trash 需要刷新才能拿到新进入回收站的数据
        if (hasDelete) {
          void loadTrash(true)
        }

        // permanent_delete：只影响 trash，本地做一次增量移除即可
        if (hasPermanentDelete) {
          trash.value = applyTrashLocalOperation(trash.value, result.operation)
        }
      }

      hasLoaded.value = true
      hasTrashLoaded.value = true
    }
    catch (commitError) {
      error.value = commitError instanceof Error ? commitError.message : String(commitError)
      throw commitError
    }
    finally {
      isLoading.value = false
    }
  }

  const config = computed(() => snapshot.value?.config)
  const languages = computed(() => snapshot.value?.languages ?? [])

  const groups = computed(() =>
    items.value.filter((item): item is Extract<TinyI18nItem, { type: 'group' }> => item.type === 'group'),
  )
  const translations = computed(() =>
    items.value.filter((item): item is Extract<TinyI18nItem, { type: 'message' }> => item.type === 'message'),
  )

  const state = computed(() => ({
    snapshot: snapshot.value,
    config: config.value,
    languages: languages.value,
    items: items.value,
    groups: groups.value,
    translations: translations.value,
    trash: trash.value,

    hasLoaded: hasLoaded.value,
    hasTrashLoaded: hasTrashLoaded.value,
    isLoading: isLoading.value,
    isTrashLoading: isTrashLoading.value,
    error: error.value,
    trashError: trashError.value,
  }))

  return {
    // 数据
    state,
    snapshot,
    config,
    languages,
    items,
    groups,
    translations,
    trash,

    // 请求
    load,
    loadTrash,
    ensureLoaded,
    ensureTrashLoaded,

    // 写入
    applyLocalOperation,
    commit,
  }
})
