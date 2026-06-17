import { createGlobalState } from "@vueuse/core";
import { computed, ref } from "vue";

export const useMessageSearchQuery = createGlobalState(() => {
  const rawQuery = ref("");
  const query = computed(() => rawQuery.value.trim().toLowerCase());

  function setQuery(value: string) {
    rawQuery.value = value;
  }

  function clearQuery() {
    rawQuery.value = "";
  }

  return {
    query,
    setQuery,
    clearQuery,
  };
});
