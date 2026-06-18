interface ProjectVisibleRowsOptions {
  matchedIds?: Set<string>
}

export function projectVisibleRows(
  tree: Pick<LocaleTreeModel, 'roots' | 'byId' | 'descendantsById'>,
  expandedIds: Set<string>,
  options: ProjectVisibleRowsOptions = {},
) {
  const { matchedIds } = options
  const visibleRows: LocaleTreeNode[] = []

  function hasMatchedDescendant(nodeId: string) {
    if (!matchedIds) {
      return false
    }

    return (tree.descendantsById.get(nodeId) ?? []).some(node =>
      matchedIds.has(node.id),
    )
  }

  function visit(node: LocaleTreeGroupNode) {
    const currentNode = tree.byId.get(node.id)
    if (!currentNode) {
      return
    }

    const shouldInclude
      = !matchedIds || matchedIds.has(node.id) || hasMatchedDescendant(node.id)

    if (!shouldInclude) {
      return
    }

    visibleRows.push(currentNode)

    const shouldVisitChildren = matchedIds
      ? hasMatchedDescendant(node.id)
      : expandedIds.has(node.id)

    if (!shouldVisitChildren) {
      return
    }

    for (const child of node.children) {
      visit(child)
    }
  }

  for (const root of tree.roots) {
    visit(root)
  }

  return visibleRows
}
