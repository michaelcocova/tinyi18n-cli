import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { useGroupTree } from "./useGroupTree.ts";

export function useMoveTargetPolicy(sourceIds: MaybeRefOrGetter<string[]>) {
  const { tree } = useGroupTree();

  const blockedIds = computed(() => {
    const sourceIdSet = new Set(toValue(sourceIds));
    const nextBlockedIds = new Set(sourceIdSet);

    for (const id of sourceIdSet) {
      const descendants = tree.value.descendantsById.get(id) ?? [];
      for (const descendant of descendants) {
        nextBlockedIds.add(descendant.id);
      }
    }

    return [...nextBlockedIds];
  });

  return {
    blockedIds,
  };
}
