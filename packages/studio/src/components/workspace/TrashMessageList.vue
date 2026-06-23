<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { VList } from 'virtua/vue'
import { computed, onMounted } from 'vue'
import { useTrash } from '../../composables/message/useTrash.ts'
import { projectVisibleRows } from '../../composables/tree/projectVisibleRows.ts'
import { cn } from '../../utils/tailwind.ts'
import TrashMessageRow from './TrashMessageRow.vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { tree, load } = useTrash()

// In trash, we probably want everything expanded by default, or we can use a separate expansion state.
// For simplicity, we just expand all if it's a tree, or flat list.
const expandedIds = computed(() => {
  const ids = new Set<string>()
  const traverse = (nodes: any[]) => {
    for (const node of nodes) {
      if (node.hasChildren) {
        ids.add(node.id)
        traverse(node.children)
      }
    }
  }
  traverse(tree.value.roots)
  return ids
})

const rows = computed(() =>
  projectVisibleRows(tree.value, expandedIds.value, {}),
)

onMounted(() => {
  void load(true)
})
</script>

<template>
  <div class="relative h-full overflow-hidden">
    <div
      v-if="rows.length === 0"
      class="flex h-full flex-col items-center justify-center text-muted-foreground gap-4"
    >
      <div class="text-sm">
        回收站为空
      </div>
    </div>
    <VList
      v-else
      v-slot="{ item }"
      :data="rows"
      :class="cn('h-full', props?.class)"
      :item-size="32"
    >
      <TrashMessageRow
        :key="item.id"
        :item="item"
      />
    </VList>
  </div>
</template>
