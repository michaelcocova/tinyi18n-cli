<script setup lang="ts">
import { AlertCircle, CheckCircle2, FileJson } from '@lucide/vue'
import { computed } from 'vue'

const props = defineProps<{
  files: string[]
  skipped: Array<{ id: string, path: string, reason: string }>
}>()

const summary = computed(() => {
  const dirsMap = new Map<string, string[]>()
  const totalLangs = new Set<string>()

  props.files.forEach((f) => {
    const parts = f.split(/[/\\]/)
    const filename = parts.pop() || ''
    const lang = filename.replace(/\.[^.]+$/, '')

    totalLangs.add(lang)

    // Get the directory path (everything before the filename)
    // If it's a very long path, we just take the last 2-3 segments for display
    let dirPath = parts.join('/')
    if (parts.length > 3) {
      dirPath = `{path}/${parts.slice(-3).join('/')}`
    }

    if (!dirsMap.has(dirPath)) {
      dirsMap.set(dirPath, [])
    }
    dirsMap.get(dirPath)!.push(filename)
  })

  return {
    totalLangs: Array.from(totalLangs),
    groups: Array.from(dirsMap.entries()).map(([dir, files]) => ({
      dir,
      files,
    })),
  }
})
</script>

<template>
  <div
    class="flex w-full flex-col gap-3 rounded-lg border bg-background p-4 shadow-lg w-[420px] pointer-events-auto"
  >
    <div class="flex items-center gap-2 text-emerald-600">
      <CheckCircle2 class="size-5" />
      <h3 class="font-semibold text-sm">
        所有文件生成完成！
      </h3>
    </div>

    <div class="space-y-3 text-xs">
      <div class="flex flex-col gap-1.5 text-muted-foreground">
        <div class="flex items-center justify-between">
          <span>共生成了 <strong>{{ files.length }}</strong> 个文件</span>
          <span>包含 <strong>{{ summary.totalLangs.length }}</strong> 种语言</span>
        </div>
      </div>

      <div class="rounded-md border bg-muted/30">
        <div
          class="flex items-center gap-1.5 font-medium text-foreground p-2.5 border-b bg-muted/50"
        >
          <FileJson class="size-3.5" />
          文件详情
        </div>

        <div class="p-2 max-h-[240px] overflow-y-auto custom-scrollbar">
          <div
            v-for="(group, idx) in summary.groups"
            :key="idx"
            class="mb-3 last:mb-0"
          >
            <div
              class="text-xs font-mono text-muted-foreground mb-1.5 px-1 truncate"
              :title="group.dir"
            >
              {{ group.dir }}/
            </div>
            <div class="flex flex-wrap gap-1.5 px-1">
              <span
                v-for="file in group.files"
                :key="file"
                class="inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-600 border border-emerald-500/20"
              >
                {{ file }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="skipped.length > 0"
        class="flex items-start gap-2 pt-1 text-amber-600"
      >
        <AlertCircle class="size-3.5 mt-0.5 shrink-0" />
        <span class="leading-relaxed">
          已跳过 {{ skipped.length }} 个未配置 Key 或非法的项目。
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 4px;
}
</style>
