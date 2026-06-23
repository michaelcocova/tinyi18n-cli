<script setup lang="ts">
import type { LocaleTreeNode } from '../../../../cli/src/core/message.ts'
import { FolderPlus, Plus, Trash2 } from '@lucide/vue'
import { useTranslations } from '../../composables/message/useTranslations'
import { confirm } from '../../utils/confirm'
import { Button } from '../ui/button'

const props = defineProps<{
  item: LocaleTreeNode
}>()

const { createGroup, createMessage, removeItems, toggleExpanded, select } = useTranslations()

async function handleAddGroup() {
  const nextItem = await createGroup(props.item.id)
  if (!nextItem) {
    return
  }

  toggleExpanded(props.item.id, true)
  select(nextItem.id)
}

async function handleAddMessage() {
  const nextItem = await createMessage(props.item.id)
  if (!nextItem) {
    return
  }

  if (nextItem.parent) {
    toggleExpanded(nextItem.parent, true)
  }
  select(nextItem.id)
}

async function handleDeleteItem() {
  const ok = await confirm({
    title: '确定删除这条记录吗？',
    description: '删除后会移入最近删除。',
    confirmText: '删除',
    confirmVariant: 'destructive',
  })
  if (!ok)
    return
  await removeItems([props.item.id])
}
</script>

<template>
  <div class="pointer-events-auto flex items-center gap-1">
    <template v-if="item.original.type === 'group'">
      <Button
        class="size-5 rounded"
        variant="ghost"
        size="icon-sm"
        @click.stop.prevent="handleAddGroup"
      >
        <FolderPlus class="size-3" />
      </Button>
      <Button
        class="size-5 rounded"
        variant="ghost"
        size="icon-sm"
        @click.stop.prevent="handleAddMessage"
      >
        <Plus class="size-3" />
      </Button>
    </template>
    <Button
      class="size-5 rounded"
      variant="ghost"
      size="icon-sm"
      @click.stop.prevent="handleDeleteItem"
    >
      <Trash2 class="size-3" />
    </Button>
  </div>
</template>
