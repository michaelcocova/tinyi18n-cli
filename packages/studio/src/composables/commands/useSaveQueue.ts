import { createGlobalState } from "@vueuse/core";
import { ref } from "vue";
import { createTinyI18nOperationScheduler } from "../io/operation.ts";
import { useTinyI18nDocument } from "../core/useTinyI18nDocument.ts";

export const useSaveQueue = createGlobalState(() => {
  const { commit } = useTinyI18nDocument();
  const lastSavedAt = ref<number>();
  const saveError = ref("");
  const scheduler = createTinyI18nOperationScheduler({
    delay: 1500,
    save: async (operations) => {
      try {
        saveError.value = "";
        await commit(operations);
        lastSavedAt.value = Date.now();
      } catch (error) {
        saveError.value = error instanceof Error ? error.message : String(error);
        throw error;
      }
    },
  });

  function push(operation: TinyI18nOperation) {
    saveError.value = "";
    scheduler.schedule(operation);
  }

  async function flush() {
    await scheduler.flush();
  }

  return {
    saving: scheduler.isSaving,
    pendingCount: scheduler.pendingCount,
    lastSavedAt,
    saveError,
    push,
    flush,
  };
});
