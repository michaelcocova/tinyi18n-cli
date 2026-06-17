import { createGlobalState } from "@vueuse/core";
import { ref, watch } from "vue";
import { useMessageTree } from "./useMessageTree.ts";

export const useMessageSelection = createGlobalState(() => {
  const { tree } = useMessageTree();
  const selectedId = ref<string>();

  watch(tree, (nextTree) => {
    if (!selectedId.value || nextTree.byId.has(selectedId.value)) {
      return;
    }

    selectedId.value = undefined;
  });

  function select(id?: string) {
    if (!id || !tree.value.byId.has(id)) {
      selectedId.value = undefined;
      return;
    }

    selectedId.value = selectedId.value === id ? undefined : id;
  }

  function isSelected(id: string) {
    return selectedId.value === id;
  }

  return {
    selectedId,
    isSelected,
    select,
  };
});
