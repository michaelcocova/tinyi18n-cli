import type { ComputedRef, Ref } from 'vue'
import type { LocaleTreeModel } from '../../../../cli/src/core/message.ts'
import type { LocaleTreeNode, MaybeArray, TinyI18nItem, TinyI18nOperation } from './types.ts'
import { computed, ref, watch } from 'vue'
import { useDataCenter } from '../data-center/useDataCenter.ts'
import { matchPathFilterStrings } from '../path-query.ts'
import { buildMessageTree } from './buildMessageTree.ts'
import { useTreeExpansionState } from './useTreeExpansionState.ts'

export interface FactoryCenterFilterState {
  /**
   * 搜索过滤对象（直接与 SearchBox v-model 对齐，不需要上层转换）
   */
  filterState: Ref<{
    query: string
    pathFilter: string[]
    localeScope: string[]
    issues: string[]
  }>

  /** 可用语言列表（用于 UI options） */
  availableLocales: ComputedRef<string[]>

  /**
   * 匹配到的 node ids（包含祖先链，确保树能展开到命中项）
   * - 没有任何 query/filters 时返回 `undefined`，方便 UI 做 “不过滤” 的分支优化
   */
  matchedIds: ComputedRef<Set<string> | undefined>
}

export interface UseFactoryCenterOptions {
  ready?: Ref<boolean> | ComputedRef<boolean>
  defaultExpandedDepth?: number | 'infinite'

  /**
   * 期望检查的语言列表（用于“缺失翻译/某语言为空”等过滤）。
   * 不传时默认取 `useDataCenter().languages`。
   */
  locales?: Ref<string[]> | ComputedRef<string[]> | string[]

  /**
   * 默认语言（通常不参与“缺失翻译”判断）。
   * 不传时默认取 `useDataCenter().config.defaultLocale`。
   */
  defaultLocale?: Ref<string | undefined> | ComputedRef<string | undefined> | string

  /**
   * 默认会使用 `useDataCenter().commit`；
   * 如果你想对接别的数据源，也可以自己传入 commit。
   */
  commit?: (operation: MaybeArray<TinyI18nOperation>) => Promise<void>

  /**
   * 是否启用 checkbox（默认启用）。
   * 某些只读树（例如分组选择器）可以关掉，少算一些状态。
   */
  checkable?: boolean
}

export interface FactoryCenterReturn {
  /** 完整 tree model（方便复用 projectVisibleRows 等工具） */
  tree: ComputedRef<LocaleTreeModel>
  roots: ComputedRef<LocaleTreeNode[]>
  cache: {
    id: ComputedRef<Map<string, LocaleTreeNode>>
    path: ComputedRef<Map<string, LocaleTreeNode>>
    childrenById: ComputedRef<Map<string, LocaleTreeNode[]>>
    descendantsById: ComputedRef<Map<string, LocaleTreeNode[]>>
  }
  state: {
    /**
     * 注意：这里用 `ComputedRef`/`Ref` 是为了保持响应式；
     * 在 Vue 模板里会自动解包，使用体验仍然像 “string[]/string”。
     */
    expandedKeys: ComputedRef<string[]>
    selectedKey: Ref<string>
    checkedKeys: ComputedRef<string[]>
    isExpanded: (id: string) => boolean
    toggleExpanded: (id: string, expanded?: boolean) => void
    isSelected: (id: string) => boolean
    toggleSelected: (id: string, selected: boolean) => void
    isChecked: (id: string) => boolean
    isIndeterminate: (id: string) => boolean
    toggleChecked: (id: string, checked?: boolean) => void
  }

  /** 额外导出：如果你希望用 Set/Node 来做高性能投影 */
  expandedIds: Ref<Set<string>>
  checkedIds: Ref<Set<string>>
  selectedId: Ref<string>
  selectedNode: ComputedRef<LocaleTreeNode | undefined>

  operation: (operation: MaybeArray<TinyI18nOperation>) => Promise<void>
  filter: FactoryCenterFilterState
}

function itemMatchesQuery(item: TinyI18nItem, query: string, localeScope: string[]) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery)
    return true

  const texts = [item.key]
  if (item.type === 'group') {
    texts.push(item.title)
  }
  else {
    const translations = item.translations ?? {}
    const targets = localeScope.length ? localeScope : Object.keys(translations)
    texts.push(...targets.map(code => translations[code]))
  }

  return texts.some(text => String(text ?? '').toLowerCase().includes(normalizedQuery))
}

function resolveRefOrValue<T>(value: Ref<T> | ComputedRef<T> | T | undefined): T | undefined {
  if (!value)
    return undefined
  if (typeof value === 'object' && 'value' in value) {
    return value.value
  }
  return value as T
}

function normalizeCheckedIds(tree: LocaleTreeModel, ids: Iterable<string>) {
  const nextIds = new Set(ids)
  const nodes = [...tree.flat].sort((a, b) => b.depth - a.depth)

  for (const node of nodes) {
    const children = tree.childrenById.get(node.id) ?? []
    if (children.length === 0) {
      continue
    }

    const allChildrenChecked = children.every(child => nextIds.has(child.id))
    if (allChildrenChecked) {
      nextIds.add(node.id)
    }
    else {
      nextIds.delete(node.id)
    }
  }

  return nextIds
}

function resolveSiblingMaxIndex(items: TinyI18nItem[], parent?: string) {
  let maxIndex = -1
  for (const item of items) {
    if (item.parent !== parent)
      continue
    maxIndex = Math.max(maxIndex, typeof item.index === 'number' ? item.index : 0)
  }
  return maxIndex
}

/**
 * 给操作补齐 index 语义：
 * - create：在当前 parent 层级追加到末尾（index = siblingsMax + 1）
 * - move：移动到目标 parent 的末尾（通过额外的 update(index) 实现）
 *
 * 备注：这样做的好处是：
 * - 本地增量应用时排序稳定
 * - 即使 server 端没有显式处理 index，我们也能得到预期表现
 */
function decorateOperationWithIndex(
  currentItems: TinyI18nItem[],
  operation: TinyI18nOperation,
): TinyI18nOperation | TinyI18nOperation[] {
  if (operation.type === 'create') {
    const maxIndex = resolveSiblingMaxIndex(currentItems, operation.data.parent)
    return {
      ...operation,
      data: {
        ...operation.data,
        index: Number.isFinite((operation.data as any).index) ? (operation.data as any).index : maxIndex + 1,
      } as any,
    }
  }

  if (operation.type === 'move') {
    const maxIndex = resolveSiblingMaxIndex(currentItems, operation.data.parent)
    const updateOps: TinyI18nOperation[] = operation.data.ids.map((id, i) => ({
      type: 'update',
      data: {
        id,
        patch: { index: maxIndex + 1 + i } as any,
      },
    }))
    return [operation, ...updateOps]
  }

  return operation
}

function decorateOperationsWithIndex(
  currentItems: TinyI18nItem[],
  operations: TinyI18nOperation | TinyI18nOperation[],
) {
  const ops = Array.isArray(operations) ? operations : [operations]
  const nextOps: TinyI18nOperation[] = []
  let nextItems = currentItems

  for (const op of ops) {
    const decorated = decorateOperationWithIndex(nextItems, op)
    const decoratedArr = Array.isArray(decorated) ? decorated : [decorated]
    nextOps.push(...decoratedArr)

    // 尝试用本地语义预估一下 items（只为了让后续 create 计算 index 正确）
    // 这里不需要完全精确，主要保证同一批 operations 内 index 递增即可。
    for (const d of decoratedArr) {
      if (d.type === 'create') {
        nextItems = [...nextItems, d.data as any]
      }
      else if (d.type === 'move') {
        nextItems = nextItems.map((item) => {
          if (!d.data.ids.includes(item.id))
            return item
          return { ...item, parent: d.data.parent } as any
        })
      }
      else if (d.type === 'update') {
        nextItems = nextItems.map((item) => {
          if (item.id !== d.data.id)
            return item
          return { ...item, ...(d.data.patch as any) } as any
        })
      }
    }
  }

  return nextOps
}

/**
 * 工厂中心（可复用树模型）：
 * - 输入：`items`（ref 或 computed）
 * - 输出：roots/cache/state/operation/filter
 */
export function useFactoryCenter(
  items: Ref<TinyI18nItem[]> | ComputedRef<TinyI18nItem[]>,
  options: UseFactoryCenterOptions = {},
): FactoryCenterReturn {
  const ready = options.ready ?? ref(true)
  const defaultExpandedDepth = options.defaultExpandedDepth ?? 1
  const checkable = options.checkable ?? true
  const dataCenter = useDataCenter()
  const commit = options.commit ?? dataCenter.commit

  // 1) Tree building
  const tree = computed(() => buildMessageTree(items.value as any))

  // 2) Expansion state
  const expansion = useTreeExpansionState(tree as any, {
    defaultExpandedDepth,
    ready,
  })

  // 3) Selection state
  const selectedId = ref<string>('')
  const selectedNode = computed(() => {
    if (!selectedId.value)
      return undefined
    return tree.value.byId.get(selectedId.value) as any
  })
  watch(tree, (nextTree) => {
    if (!selectedId.value)
      return
    if (!nextTree.byId.has(selectedId.value)) {
      selectedId.value = ''
    }
  })
  function isSelected(id: string) {
    return selectedId.value === id
  }
  function toggleSelected(id: string, selected: boolean) {
    if (!tree.value.byId.has(id))
      return
    selectedId.value = selected ? id : ''
  }

  // 4) Checked state（checkbox）
  const checkedIds = ref(new Set<string>())
  watch(tree, (nextTree) => {
    if (!checkable)
      return
    const validIds = new Set(nextTree.ids)
    checkedIds.value = normalizeCheckedIds(
      nextTree,
      [...checkedIds.value].filter(id => validIds.has(id)),
    )
  })
  function isChecked(id: string) {
    return checkedIds.value.has(id)
  }
  function isIndeterminate(id: string) {
    if (checkedIds.value.has(id))
      return false
    const descendants = tree.value.descendantsById.get(id) ?? []
    if (descendants.length === 0)
      return false
    return descendants.some(item => checkedIds.value.has(item.id))
  }
  function toggleChecked(id: string, checked?: boolean) {
    if (!checkable)
      return
    if (!tree.value.byId.has(id))
      return

    const nextChecked = checked ?? !checkedIds.value.has(id)
    const nextIds = new Set(checkedIds.value)
    const relatedIds = [id, ...(tree.value.descendantsById.get(id) ?? []).map(node => node.id)]

    for (const relatedId of relatedIds) {
      if (nextChecked)
        nextIds.add(relatedId)
      else nextIds.delete(relatedId)
    }

    checkedIds.value = normalizeCheckedIds(tree.value, nextIds)
  }

  // 5) Filter state（与 SearchBox v-model 对齐）
  const filterState = ref({
    query: '',
    pathFilter: [] as string[],
    localeScope: [] as string[],
    issues: [] as string[],
  })

  const availableLocales = computed(() => {
    return (
      resolveRefOrValue(options.locales)
      ?? dataCenter.languages.value
      ?? []
    )
  })
  // 备注：defaultLocale 目前未参与过滤逻辑；如后续需要“缺失翻译排除默认语言”，再接入即可。

  const duplicateKeySet = computed(() => {
    const map = new Map<string, number>()
    for (const node of tree.value.flat) {
      const original = node.original as any as TinyI18nItem
      if (original.type !== 'message')
        continue
      const key = String(original.key ?? '').trim()
      if (!key)
        continue
      const bucketKey = `${original.parent ?? 'root'}::${key}`
      map.set(bucketKey, (map.get(bucketKey) ?? 0) + 1)
    }
    return new Set([...map.entries()].filter(([, count]) => count > 1).map(([k]) => k))
  })

  function extractPlaceholders(text: string) {
    const matches = String(text ?? '').match(/\{[^}]+\}/g) ?? []
    return new Set(matches)
  }

  function hasPlaceholderMismatch(translations: Record<string, any>, localeScope: string[]) {
    const locales = localeScope.length ? localeScope : Object.keys(translations)
    const sets = locales
      .map(code => ({ code, set: extractPlaceholders(String(translations[code] ?? '')) }))
      .filter(item => item.set.size > 0)
    if (sets.length <= 1)
      return false
    const base = sets[0].set
    for (const s of sets.slice(1)) {
      if (s.set.size !== base.size)
        return true
      for (const p of s.set) {
        if (!base.has(p))
          return true
      }
    }
    return false
  }

  function matchesIssues(node: LocaleTreeModel['flat'][number]) {
    const original = node.original as any as TinyI18nItem
    const selectedIssues = filterState.value.issues ?? []
    if (!selectedIssues.length)
      return true

    if (original.type !== 'message') {
      return true
    }

    const translations = original.translations ?? {}
    const scope = filterState.value.localeScope ?? []
    const localesToCheck = scope.length ? scope : availableLocales.value

    const parentKey = `${original.parent ?? 'root'}::${String(original.key ?? '').trim()}`

    function matchOne(issue: string) {
      if (issue === 'missing_key') {
        return !String(original.key ?? '').trim()
      }
      if (issue === 'duplicate_key') {
        return duplicateKeySet.value.has(parentKey)
      }
      if (issue === 'missing_translation') {
        return localesToCheck.some(code => translations[code] === undefined)
      }
      if (issue.startsWith('$missing_translation:')) {
        const locale = issue.split(':')[1]
        return Boolean(locale) && translations[locale] === undefined
      }
      if (issue === 'placeholder_mismatch') {
        return hasPlaceholderMismatch(translations, localesToCheck)
      }
      // 其它 issue 暂未实现：返回 false（不命中）
      return false
    }

    return selectedIssues.some(matchOne)
  }

  const matchedIds = computed(() => {
    const hasActiveFilters
      = Boolean(filterState.value.query.trim())
        || (filterState.value.pathFilter?.length ?? 0) > 0
        || (filterState.value.localeScope?.length ?? 0) > 0
        || (filterState.value.issues?.length ?? 0) > 0
    if (!hasActiveFilters)
      return undefined

    const matched = new Set<string>()
    for (const node of tree.value.flat) {
      if (!itemMatchesQuery(node.original as any, filterState.value.query, filterState.value.localeScope ?? [])) {
        continue
      }
      if (!matchPathFilterStrings(node as any, filterState.value.pathFilter ?? [])) {
        continue
      }
      if (!matchesIssues(node)) {
        continue
      }

      matched.add(node.id)
      for (const parentNode of node.meta.chain) {
        matched.add(parentNode.id)
      }
    }

    return matched
  })

  const filter: FactoryCenterFilterState = {
    filterState,
    availableLocales,
    matchedIds,
  }

  // 6) Operation
  async function operation(op: MaybeArray<TinyI18nOperation>) {
    // 这里用当前 items（而不是 dataCenter.items）是为了支持「对任意数据源建树」的复用场景
    const decorated = decorateOperationsWithIndex(items.value, op as any)
    await commit(decorated as any)
  }

  return {
    tree: tree as any,
    roots: computed(() => (tree.value.roots as any) ?? []),
    cache: {
      id: computed(() => tree.value.byId as any),
      path: computed(() => tree.value.byPath as any),
      childrenById: computed(() => tree.value.childrenById as any),
      descendantsById: computed(() => tree.value.descendantsById as any),
    },
    state: {
      expandedKeys: computed(() => [...expansion.expandedIds.value]),
      selectedKey: selectedId,
      checkedKeys: computed(() => (checkable ? [...checkedIds.value] : [])),
      isExpanded: expansion.isExpanded,
      toggleExpanded: (id, expanded) => expansion.toggleExpanded(id, expanded),
      isSelected,
      toggleSelected,
      isChecked,
      isIndeterminate,
      toggleChecked,
    },
    expandedIds: expansion.expandedIds,
    checkedIds,
    selectedId,
    selectedNode,
    operation,
    filter,
  }
}
