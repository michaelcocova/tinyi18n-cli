<script setup lang="ts">
import type { LocaleTreeNode } from '../../../../cli/src/core/message.ts'
import { RotateCcw, Trash2 } from '@lucide/vue'
import { useDataCenter } from '../../composables/data-center/useDataCenter.ts'
import { confirm } from '../../utils/confirm'
import { Button } from '../ui/button'

const props = defineProps<{
  item: LocaleTreeNode
}>()

const { commit } = useDataCenter()

async function handleRestore() {
  await commit({ type: 'restore', data: { ids: [props.item.id] } })
}

async function handleDelete() {
  const ok = await confirm({
    title: '确定彻底删除这条记录吗？',
    description: '此操作不可恢复。',
    confirmText: '彻底删除',
    confirmVariant: 'destructive',
  })
  if (!ok)
    return
  await commit({ type: 'permanent_delete', data: { ids: [props.item.id] } })
}
</script>

<template>
  <div class="pointer-events-auto flex items-center gap-1">
    <Button
      class="size-5 rounded text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      variant="ghost"
      size="icon-sm"
      title="恢复"
      @click.stop.prevent="handleRestore"
    >
      <RotateCcw class="size-3" />
    </Button>
    <Button
      class="size-5 rounded text-red-600 hover:text-red-700 hover:bg-red-50"
      variant="ghost"
      size="icon-sm"
      title="彻底删除"
      @click.stop.prevent="handleDelete"
    >
      <Trash2 class="size-3" />
    </Button>
  </div>
</template>
