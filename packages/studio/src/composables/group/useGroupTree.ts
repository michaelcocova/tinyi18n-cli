import { createGlobalState } from "@vueuse/core";
import { computed } from "vue";
import { useTinyI18nDocument } from "../core/useTinyI18nDocument.ts";
import { buildGroupTree } from "../tree/buildGroupTree.ts";

export const useGroupTree = createGlobalState(() => {
  const { document } = useTinyI18nDocument();
  const tree = computed(() => buildGroupTree(document.value.items));

  return {
    tree,
  };
});
