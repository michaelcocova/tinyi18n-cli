<script setup lang="ts">
import { computed, onMounted } from "vue";
import {
  AlertTriangle,
  CopyMinus,
  FileWarning,
  Languages,
  RefreshCw,
  ScanSearch,
} from "@lucide/vue";
import { Button } from "../components/ui/button/index";
import { useQualityCheck } from "../composables/quality/useQualityCheck";

const { report, isScanning, error, refresh } = useQualityCheck();

const summaryCards = computed(() => [
  { label: "已扫描消息", value: report.value.scannedMessages, icon: ScanSearch },
  { label: "缺失 key", value: report.value.counts.missing_key, icon: FileWarning },
  { label: "缺失翻译", value: report.value.counts.missing_translation, icon: Languages },
  { label: "空翻译", value: report.value.counts.empty_translation, icon: AlertTriangle },
  { label: "全局重复", value: report.value.counts.duplicate_path_global, icon: CopyMinus },
  { label: "分组内重复", value: report.value.counts.duplicate_path_group, icon: CopyMinus },
]);

onMounted(() => {
  void refresh();
});
</script>

<template>
  <div class="flex min-h-full flex-col bg-white p-4 text-zinc-950 lg:p-6">
    <section class="mx-auto w-full max-w-6xl">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-medium uppercase tracking-widest text-zinc-400">质量检查</p>
          <h1 class="mt-2 text-2xl font-semibold">本地消息质量扫描</h1>
          <p class="mt-2 text-sm text-zinc-500">
            基于当前工作区数据在 worker 中扫描，不阻塞主线程。
          </p>
        </div>
        <Button variant="outline" size="sm" class="border-zinc-300" @click="refresh">
          <RefreshCw class="size-4" />
          重新扫描
        </Button>
      </div>

      <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="card in summaryCards"
          :key="card.label"
          class="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm text-zinc-500">{{ card.label }}</p>
            <component :is="card.icon" class="size-4 text-zinc-400" />
          </div>
          <strong class="mt-3 block text-2xl font-semibold text-zinc-950">{{ card.value }}</strong>
        </article>
      </div>

      <div
        v-if="error"
        class="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      >
        {{ error }}
      </div>
    </section>
  </div>
</template>
