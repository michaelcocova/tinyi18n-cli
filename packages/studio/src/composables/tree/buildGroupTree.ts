import { buildMessageTree } from "./buildMessageTree.ts";

export function buildGroupTree(items: TinyI18nItem[]): GroupTreeModel {
  const groupItems = items.filter((item): item is TinyI18nGroup => item.type === "group");
  const tree = buildMessageTree(groupItems);

  return {
    roots: tree.roots,
    flat: tree.flat,
    ids: tree.ids,
    expandableIds: tree.expandableIds,
    byId: tree.byId,
    byPath: tree.byPath,
    childrenById: tree.childrenById,
    descendantsById: tree.descendantsById,
  };
}
