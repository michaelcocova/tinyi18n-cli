function pushMapArray<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const bucket = map.get(key);
  if (bucket) {
    bucket.push(value);
    return;
  }

  map.set(key, [value]);
}

export function buildMessageTree(items: TinyI18nItem[]): LocaleTreeModel {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const childIdsByParent = new Map<string, string[]>();

  for (const item of items) {
    if (!item.parent) {
      continue;
    }

    const childIds = childIdsByParent.get(item.parent) ?? [];
    childIds.push(item.id);
    childIdsByParent.set(item.parent, childIds);
  }

  const byId = new Map<string, LocaleTreeNode>();
  const byPath = new Map<string, LocaleTreeNode>();

  function resolveNode(item: TinyI18nItem): LocaleTreeNode {
    const existing = byId.get(item.id);
    if (existing) {
      return existing;
    }

    const parentItem = item.parent ? itemsById.get(item.parent) : undefined;
    const parentNode = parentItem ? resolveNode(parentItem) : undefined;
    const chain = parentNode ? [...parentNode.meta.chain, parentNode] : [];
    const keyChain = [...chain.map((node) => node.key), item.key];
    const path = keyChain.join(".");
    const node: LocaleTreeNode = {
      id: item.id,
      parent: item.parent,
      type: item.type,
      key: item.key,
      depth: chain.length,
      hasChildren: (childIdsByParent.get(item.id)?.length ?? 0) > 0,
      original: item,
      meta: {
        path,
        chain,
        keyChain,
      },
    };

    byId.set(item.id, node);
    byPath.set(path, node);

    return node;
  }

  for (const item of items) {
    resolveNode(item);
  }

  function buildGroupNode(id: string): LocaleTreeGroupNode | undefined {
    const node = byId.get(id);
    if (!node) {
      return undefined;
    }

    return {
      id: node.id,
      type: node.type,
      key: node.key,
      depth: node.depth,
      hasChildren: node.hasChildren,
      original: node.original,
      meta: node.meta,
      children: (childIdsByParent.get(id) ?? [])
        .map((childId) => buildGroupNode(childId))
        .filter((child): child is LocaleTreeGroupNode => Boolean(child)),
    };
  }

  const roots = items
    .filter((item) => !item.parent || !itemsById.has(item.parent))
    .map((item) => buildGroupNode(item.id))
    .filter((node): node is LocaleTreeGroupNode => Boolean(node));

  const flat: LocaleTreeNode[] = [];
  const ids: string[] = [];
  const expandableIds: string[] = [];
  const childrenById = new Map<string, LocaleTreeNode[]>();
  const descendantsById = new Map<string, LocaleTreeNode[]>();

  for (const node of byId.values()) {
    if (!node.parent) {
      continue;
    }

    pushMapArray(childrenById, node.parent, node);
  }

  function flatten(node: LocaleTreeGroupNode) {
    const flatNode = byId.get(node.id);
    if (!flatNode) {
      return;
    }

    flat.push(flatNode);
    ids.push(flatNode.id);
    if (flatNode.hasChildren) {
      expandableIds.push(flatNode.id);
    }

    for (const child of node.children) {
      flatten(child);
    }
  }

  for (const root of roots) {
    flatten(root);
  }

  function cacheDescendants(node: LocaleTreeGroupNode): LocaleTreeNode[] {
    const descendants: LocaleTreeNode[] = [];

    for (const child of node.children) {
      const childNode = byId.get(child.id);
      if (childNode) {
        descendants.push(childNode);
      }

      descendants.push(...cacheDescendants(child));
    }

    descendantsById.set(node.id, descendants);
    return descendants;
  }

  for (const root of roots) {
    cacheDescendants(root);
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
  };
}
