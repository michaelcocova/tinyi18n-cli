import { createGlobalState } from "@vueuse/core";
import { computed } from "vue";
import { usePathFilters } from "../group/usePathFilters.ts";
import { matchSearchAndFilters } from "../tree/matchSearchAndFilters.ts";
import { useMessageSearchQuery } from "./useMessageSearchQuery.ts";
import { useMessageTree } from "./useMessageTree.ts";

export const useMessageSearchMatches = createGlobalState(() => {
  const { tree } = useMessageTree();
  const { query } = useMessageSearchQuery();
  const { filters } = usePathFilters();

  const matchedIds = computed(() => {
    const hasActiveFilters = Boolean(query.value) || filters.value.length > 0;
    if (!hasActiveFilters) {
      return undefined;
    }

    return matchSearchAndFilters(tree.value, query.value, filters.value);
  });

  return {
    matchedIds,
  };
});
