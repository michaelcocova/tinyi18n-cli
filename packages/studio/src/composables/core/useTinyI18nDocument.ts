import { createGlobalState } from '@vueuse/core'
import { computed, ref } from 'vue'
import { getWebConfig } from '../../web-config.ts'

function collectDescendantIds(items: TinyI18nItem[], ids: Iterable<string>) {
  const relatedIds = new Set(ids)
  let changed = true

  while (changed) {
    changed = false

    for (const item of items) {
      if (!item.parent || relatedIds.has(item.id)) {
        continue
      }

      if (relatedIds.has(item.parent)) {
        relatedIds.add(item.id)
        changed = true
      }
    }
  }

  return relatedIds
}

function applyOperationToItems(
  items: TinyI18nItem[],
  operation: TinyI18nOperation,
) {
  if (operation.type === 'create') {
    return [...items, operation.data]
  }

  if (operation.type === 'update') {
    return items.map((item) => {
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
    })
  }

  if (operation.type === 'delete') {
    const removedIds = collectDescendantIds(items, operation.data.ids)
    return items.filter(item => !removedIds.has(item.id))
  }

  const movingIds = collectDescendantIds(items, operation.data.ids)
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

function applyOperationsToDocumentState(
  items: TinyI18nItem[],
  operations: TinyI18nOperation | TinyI18nOperation[],
) {
  const nextOperations = Array.isArray(operations) ? operations : [operations]
  return nextOperations.reduce(applyOperationToItems, items)
}

export const useTinyI18nDocument = createGlobalState(() => {
  const webConfig = getWebConfig()
  const snapshot = ref<TinyI18nSnapshot>()
  const items = ref<TinyI18nItem[]>([])
  const config = ref<TinyI18nConfig>()
  const isLoading = ref(false)
  const hasLoaded = ref(false)
  const error = ref('')
  let pendingRequest: Promise<void> | null = null

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
        items.value = nextSnapshot.items
        config.value = nextSnapshot.config
        error.value = nextSnapshot.error ?? ''
        hasLoaded.value = true
      }
      catch (loadError) {
        error.value
          = loadError instanceof Error ? loadError.message : String(loadError)
      }
      finally {
        isLoading.value = false
        pendingRequest = null
      }
    })()

    return pendingRequest
  }

  async function ensureLoaded() {
    if (hasLoaded.value) {
      return
    }

    await load()
  }

  async function applyLocalOperation(
    operation: TinyI18nOperation | TinyI18nOperation[],
  ) {
    await ensureLoaded()

    const nextItems = applyOperationsToDocumentState(items.value, operation)
    items.value = nextItems

    if (snapshot.value) {
      snapshot.value = {
        ...snapshot.value,
        items: nextItems,
      }
    }
  }

  async function commit(operation: TinyI18nOperation | TinyI18nOperation[]) {
    await ensureLoaded()

    isLoading.value = true
    error.value = ''

    try {
      const response = await fetch(`${webConfig.apiBase}/data/operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operation),
      })

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }

      const result = (await response.json()) as TinyI18nOperationResult
      await applyLocalOperation(result.operation)

      hasLoaded.value = true
    }
    catch (commitError) {
      error.value
        = commitError instanceof Error
          ? commitError.message
          : String(commitError)
      throw commitError
    }
    finally {
      isLoading.value = false
    }
  }

  const document = computed(() => ({
    snapshot: snapshot.value,
    items: items.value,
    config: config.value,
    hasLoaded: hasLoaded.value,
    isLoading: isLoading.value,
    error: error.value,
  }))

  return {
    document,
    load,
    applyLocalOperation,
    commit,
  }
})
