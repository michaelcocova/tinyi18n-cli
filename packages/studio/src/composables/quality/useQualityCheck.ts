import { computed, onScopeDispose, ref, watch } from "vue";
import { createGlobalState } from "@vueuse/core";
import { useLocaleConfig } from "../core/useLocaleConfig.ts";
import { useTinyI18nDocument } from "../core/useTinyI18nDocument.ts";

function createEmptyReport(): TinyI18nQualityReport {
  return {
    scannedMessages: 0,
    issues: [],
    counts: {
      missing_key: 0,
      missing_translation: 0,
      empty_translation: 0,
      duplicate_path_global: 0,
      duplicate_path_group: 0,
    },
    groupConflicts: [],
  };
}

function cloneItems(items: TinyI18nItem[]): TinyI18nItem[] {
  return items.map((item) => {
    if (item.type === "message") {
      return {
        ...item,
        translations: { ...item.translations },
      };
    }

    return { ...item };
  });
}

export const useQualityCheck = createGlobalState(() => {
  const { document, load } = useTinyI18nDocument();
  const { localeConfig } = useLocaleConfig();
  const report = ref<TinyI18nQualityReport>(createEmptyReport());
  const isScanning = ref(false);
  const error = ref("");
  const worker = new Worker(new URL("./quality.worker.ts", import.meta.url), {
    type: "module",
  });

  worker.onmessage = (event: MessageEvent<TinyI18nQualityReport>) => {
    report.value = event.data;
    isScanning.value = false;
  };

  worker.onerror = (event) => {
    error.value = event.message;
    isScanning.value = false;
  };

  async function run() {
    await load();
    error.value = "";
    isScanning.value = true;
    worker.postMessage({
      items: cloneItems(document.value.items),
      languages: localeConfig.value.locales.map((item) => item.code),
    });
  }

  watch(
    [() => document.value.items, () => localeConfig.value.locales],
    () => {
      if (!document.value.items.length) {
        report.value = createEmptyReport();
        return;
      }

      void run();
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    worker.terminate();
  });

  const groupedIssues = computed(() => {
    const map = new Map<TinyI18nQualityIssueKind, TinyI18nQualityIssue[]>();

    for (const issue of report.value.issues) {
      const bucket = map.get(issue.kind) ?? [];
      bucket.push(issue);
      map.set(issue.kind, bucket);
    }

    return map;
  });

  return {
    report,
    groupedIssues,
    isScanning,
    error,
    refresh: run,
  };
});
