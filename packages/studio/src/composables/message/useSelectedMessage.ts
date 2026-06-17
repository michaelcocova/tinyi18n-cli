import { createGlobalState } from "@vueuse/core";
import { computed } from "vue";
import { useMessageSelection } from "./useMessageSelection.ts";
import { useMessageTree } from "./useMessageTree.ts";

export const useSelectedMessage = createGlobalState(() => {
  const { selectedId } = useMessageSelection();
  const { tree } = useMessageTree();

  const selectedNode = computed(() =>
    selectedId.value ? tree.value.byId.get(selectedId.value) : undefined,
  );

  return {
    selectedNode,
  };
});
