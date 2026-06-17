import { matchPathFilters, type TinyI18nPathFilter } from "../path-query.ts";

function itemMatchesQuery(item: TinyI18nItem, query: string) {
  const texts = [item.key];

  if (item.type === "group") {
    texts.push(item.title);
  } else {
    texts.push(...Object.values(item.translations));
  }

  return texts.some((text) => text.toLowerCase().includes(query));
}

export function matchSearchAndFilters(
  tree: LocaleTreeModel,
  query: string,
  filters: TinyI18nPathFilter[],
) {
  const matchedIds = new Set<string>();

  for (const node of tree.flat) {
    const matchesQuery = !query || itemMatchesQuery(node.original, query);
    if (!matchesQuery || !matchPathFilters(node, filters)) {
      continue;
    }

    matchedIds.add(node.id);
    for (const parentNode of node.meta.chain) {
      matchedIds.add(parentNode.id);
    }
  }

  return matchedIds;
}
