import { createGlobalState } from "@vueuse/core";
import { ref, watch } from "vue";
import { useMessageTree } from "./useMessageTree.ts";

export const useMessageChecked = createGlobalState(() => {
  const { tree } = useMessageTree();
  const checkedIds = ref(new Set<string>());

  function normalizeCheckedIds(ids: Iterable<string>) {
    const nextIds = new Set(ids);
    const nodes = [...tree.value.flat].sort((a, b) => b.depth - a.depth);

    for (const node of nodes) {
      const children = tree.value.childrenById.get(node.id) ?? [];
      if (children.length === 0) {
        continue;
      }

      const allChildrenChecked = children.every((child) => nextIds.has(child.id));
      if (allChildrenChecked) {
        nextIds.add(node.id);
      } else {
        nextIds.delete(node.id);
      }
    }

    return nextIds;
  }

  watch(tree, (nextTree) => {
    const validIds = new Set(nextTree.ids);
    checkedIds.value = normalizeCheckedIds([...checkedIds.value].filter((id) => validIds.has(id)));
  });

  function isChecked(id: string) {
    return checkedIds.value.has(id);
  }

  function isIndeterminate(id: string) {
    if (checkedIds.value.has(id)) {
      return false;
    }

    const descendants = tree.value.descendantsById.get(id) ?? [];
    if (descendants.length === 0) {
      return false;
    }

    return descendants.some((item) => checkedIds.value.has(item.id));
  }

  function toggleChecked(id: string, checked?: boolean) {
    if (!tree.value.byId.has(id)) {
      return;
    }

    const nextChecked = checked ?? !checkedIds.value.has(id);
    const nextIds = new Set(checkedIds.value);
    const relatedIds = [id, ...(tree.value.descendantsById.get(id) ?? []).map((node) => node.id)];

    for (const relatedId of relatedIds) {
      if (nextChecked) {
        nextIds.add(relatedId);
      } else {
        nextIds.delete(relatedId);
      }
    }

    checkedIds.value = normalizeCheckedIds(nextIds);
  }

  function toggleAllChecked(checked?: boolean) {
    const nextChecked = checked ?? checkedIds.value.size !== tree.value.ids.length;
    checkedIds.value = normalizeCheckedIds(nextChecked ? tree.value.ids : []);
  }

  function clearChecked() {
    checkedIds.value = new Set();
  }

  return {
    checkedIds,
    isChecked,
    isIndeterminate,
    toggleChecked,
    toggleAllChecked,
    clearChecked,
  };
});
