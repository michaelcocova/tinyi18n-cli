import type {
  LocaleTreeGroupNode,
  LocaleTreeModel,
  LocaleTreeNode,
} from '../../../../cli/src/core/message.ts'
import type { TinyI18nItem } from './types.ts'

function pushMapArray<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const bucket = map.get(key)
  if (bucket) {
    bucket.push(value)
    return
  }
  map.set(key, [value])
}

function getItemIndex(item: TinyI18nItem | undefined) {
  return typeof item?.index === 'number' ? item.index : 0
}

/**
 * 基于 items 构建树，同时产出各种 cache（byId/byPath/children/descendants）。
 * 备注：
 * - `index` 的语义是“同一层级的排序权重”
 * - 为了保证树构建过程（roots/children/flatten）全链路稳定，我们会在构建树之前，
 *   先把每个 parent 的 children 按 `index` 做一次升序排序。
 */
export function buildMessageTree(items: TinyI18nItem[]): LocaleTreeModel {
  const itemsById = new Map(items.map(item => [item.id, item]))
  const childIdsByParent = new Map<string, string[]>()

  for (const item of items) {
    if (!item.parent)
      continue
    const childIds = childIdsByParent.get(item.parent) ?? []
    childIds.push(item.id)
    childIdsByParent.set(item.parent, childIds)
  }

  // 在建树前，先把每个 parent 下的 children 按 index 做一次升序排序（稳定输出）
  for (const [parentId, childIds] of childIdsByParent) {
    childIds.sort((a, b) => {
      const ia = getItemIndex(itemsById.get(a))
      const ib = getItemIndex(itemsById.get(b))
      return ia - ib
    })
    childIdsByParent.set(parentId, childIds)
  }

  const byId = new Map<string, LocaleTreeNode>()
  const byPath = new Map<string, LocaleTreeNode>()

  function resolveNode(item: TinyI18nItem): LocaleTreeNode {
    const existing = byId.get(item.id)
    if (existing)
      return existing

    const parentItem = item.parent ? itemsById.get(item.parent) : undefined
    const parentNode = parentItem ? resolveNode(parentItem) : undefined
    const chain = parentNode ? [...parentNode.meta.chain, parentNode] : []
    const keyChain = [...chain.map(node => node.key), item.key]
    const path = keyChain.join('.')

    const normalizedItem: TinyI18nItem = {
      ...item,
      // index 在 CLI 数据里可能缺失，这里补 0，保证后续 sort 可用
      index: Number.isFinite(item.index) ? item.index : 0,
    } as TinyI18nItem

    const node: LocaleTreeNode = {
      id: normalizedItem.id,
      parent: normalizedItem.parent,
      type: normalizedItem.type,
      key: normalizedItem.key,
      depth: chain.length,
      hasChildren: (childIdsByParent.get(normalizedItem.id)?.length ?? 0) > 0,
      // 这里的类型来自 CLI，但我们的 item 结构与其兼容
      original: normalizedItem as any,
      meta: {
        path,
        chain: chain as LocaleTreeNode[],
        keyChain,
      },
    }

    byId.set(normalizedItem.id, node)
    byPath.set(path, node)
    return node
  }

  for (const item of items) {
    resolveNode(item)
  }

  function buildGroupNode(id: string): LocaleTreeGroupNode | undefined {
    const node = byId.get(id)
    if (!node)
      return undefined

    return {
      id: node.id,
      type: node.type,
      key: node.key,
      depth: node.depth,
      hasChildren: node.hasChildren,
      original: node.original,
      meta: node.meta,
      children: (childIdsByParent.get(id) ?? [])
        .map(childId => buildGroupNode(childId))
        .filter((child): child is LocaleTreeGroupNode => Boolean(child)),
    }
  }

  const rootItems = items
    .filter(item => !item.parent || !itemsById.has(item.parent))
    .sort((a, b) => getItemIndex(a) - getItemIndex(b))

  const roots = rootItems
    .map(item => buildGroupNode(item.id))
    .filter((node): node is LocaleTreeGroupNode => Boolean(node))

  const flat: LocaleTreeNode[] = []
  const ids: string[] = []
  const expandableIds: string[] = []
  const childrenById = new Map<string, LocaleTreeNode[]>()
  const descendantsById = new Map<string, LocaleTreeNode[]>()

  for (const node of byId.values()) {
    if (!node.parent)
      continue
    pushMapArray(childrenById, node.parent, node)
  }

  function flatten(node: LocaleTreeGroupNode) {
    const flatNode = byId.get(node.id)
    if (!flatNode)
      return

    flat.push(flatNode)
    ids.push(flatNode.id)
    if (flatNode.hasChildren) {
      expandableIds.push(flatNode.id)
    }

    for (const child of node.children) {
      flatten(child)
    }
  }

  for (const root of roots) {
    flatten(root)
  }

  function cacheDescendants(node: LocaleTreeGroupNode): LocaleTreeNode[] {
    const descendants: LocaleTreeNode[] = []
    for (const child of node.children) {
      const childNode = byId.get(child.id)
      if (childNode)
        descendants.push(childNode)
      descendants.push(...cacheDescendants(child))
    }

    descendantsById.set(node.id, descendants)
    return descendants
  }

  for (const root of roots) {
    cacheDescendants(root)
  }

  return {
    roots,
    flat,
    ids,
    expandableIds,
    byId,
    byPath,
    childrenById,
    descendantsById,
  }
}
