import type { ComputedRef, Ref } from "vue";
import { ref, watch } from "vue";

export type TreeDefaultExpandedDepth = number | "infinite";

interface TreeExpansionStateOptions {
  defaultExpandedDepth?: TreeDefaultExpandedDepth;
  ready?: Ref<boolean> | ComputedRef<boolean>;
}

type ExpandableTree = Pick<LocaleTreeModel, "flat" | "byId" | "expandableIds">;

function resolveInitialExpandedIds(
  tree: ExpandableTree,
  defaultExpandedDepth: TreeDefaultExpandedDepth,
) {
  if (defaultExpandedDepth === "infinite") {
    return new Set(tree.expandableIds);
  }

  const maxDepth = Math.max(0, defaultExpandedDepth);
  return new Set(
    tree.flat.filter((node) => node.hasChildren && node.depth < maxDepth).map((node) => node.id),
  );
}

export function useTreeExpansionState(
  tree: Ref<ExpandableTree> | ComputedRef<ExpandableTree>,
  options: TreeExpansionStateOptions = {},
) {
  const defaultExpandedDepth = options.defaultExpandedDepth ?? "infinite";
  const ready = options.ready;
  const expandedIds = ref(new Set<string>());
  let initialized = false;

  watch(
    [tree, ready ?? ref(true)],
    ([nextTree, isReady]) => {
      if (!isReady) {
        return;
      }

      if (!initialized) {
        expandedIds.value = resolveInitialExpandedIds(nextTree, defaultExpandedDepth);
        initialized = true;
        return;
      }

      const validIds = new Set(nextTree.expandableIds);
      expandedIds.value = new Set([...expandedIds.value].filter((id) => validIds.has(id)));
    },
    { immediate: true },
  );

  function isExpanded(id: string) {
    return expandedIds.value.has(id);
  }

  function toggleExpanded(id: string, expanded?: boolean) {
    if (!tree.value.byId.get(id)?.hasChildren) {
      return;
    }

    const nextExpanded = expanded ?? !expandedIds.value.has(id);
    const nextIds = new Set(expandedIds.value);

    if (nextExpanded) {
      nextIds.add(id);
    } else {
      nextIds.delete(id);
    }

    expandedIds.value = nextIds;
  }

  return {
    expandedIds,
    isExpanded,
    toggleExpanded,
  };
}
