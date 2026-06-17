import { createGlobalState } from "@vueuse/core";
import { computed } from "vue";
import { useTinyI18nDocument } from "../core/useTinyI18nDocument.ts";
import { useGroupTree } from "./useGroupTree.ts";
import { useTreeExpansionState } from "../tree/useTreeExpansionState.ts";

export const useGroupMoveExpansion = createGlobalState(() => {
  const { document } = useTinyI18nDocument();
  const { tree } = useGroupTree();
  return useTreeExpansionState(tree, {
    defaultExpandedDepth: "infinite",
    ready: computed(() => document.value.hasLoaded),
  });
});
