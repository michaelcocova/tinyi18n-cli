<script setup lang="ts">
import { BrushCleaning, RotateCcw } from '@lucide/vue'
import { computed } from 'vue'
import { useDataCenter } from '../../composables/data-center/useDataCenter.ts'
import { confirm } from '../../utils/confirm'
import { Button } from '../ui/button'

const { trash, commit } = useDataCenter()

const hasItems = computed(() => trash.value.length > 0)

async function handleRestoreAll() {
  if (!hasItems.value)
    return
  const ids = trash.value.map(item => item.id)
  await commit({ type: 'restore', data: { ids } })
}

async function handleEmptyTrash() {
  if (!hasItems.value)
    return
  const ok = await confirm({
    title: '确定要清空回收站吗？',
    description: '此操作不可恢复。',
    confirmText: '清空回收站',
    confirmVariant: 'destructive',
  })
  if (!ok)
    return

  const ids = trash.value.map(item => item.id)
  await commit({ type: 'permanent_delete', data: { ids } })
}
</script>

<template>
  <div class="flex h-12 shrink-0 items-center border-b px-4 justify-between">
    <div class="font-medium">
      最近删除
    </div>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        :disabled="!hasItems"
        @click="handleRestoreAll"
      >
        <RotateCcw />
        全部恢复
      </Button>
      <Button
        variant="destructive"
        size="sm"
        :disabled="!hasItems"
        class="text-xs font-normal"
        @click="handleEmptyTrash"
      >
        <BrushCleaning />
        清空回收站
      </Button>
    </div>
  </div>
</template>
