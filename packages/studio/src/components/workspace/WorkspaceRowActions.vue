<script setup lang="ts">
import { FolderPlus, Plus, Trash2 } from '@lucide/vue'
import { useItemMutations } from '../../composables/commands/useItemMutations'
import { useMessageExpansion } from '../../composables/message/useMessageExpansion'
import { useMessageSelection } from '../../composables/message/useMessageSelection'
import { Button } from '../ui/button'

const props = defineProps<{
  item: LocaleTreeNode
}>()

const { createGroup, createMessage, removeItems } = useItemMutations()
const { toggleExpanded } = useMessageExpansion()
const { select } = useMessageSelection()

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
