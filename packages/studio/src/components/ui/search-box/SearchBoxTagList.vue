<script setup lang="ts">
import type { SearchBoxSchema } from './types'
import { Search, X } from '@lucide/vue'

const props = defineProps<{
  items: Array<{
    id: string
    schema: SearchBoxSchema
    value: string
  }>
}>()

const emit = defineEmits<{
  (event: 'removeItem', item: { id: string }): void
}>()
</script>

<template>
  <Search class="size-4 shrink-0 text-muted-foreground" />

  <span
    v-for="item in props.items"
    :key="item.id"
    class="inline-flex h-7 max-w-64 items-center gap-1 rounded-lg border border-border/60 bg-muted/40 px-2 py-1 text-xs font-normal"
    :title="`${item.schema.label} ${item.schema.operator || ':'} ${item.value}`"
  >
    <slot
      name="tag"
      :schema="item.schema"
      :value="item.value"
      :remove="() => emit('removeItem', { id: item.id })"
    >
      <span class="truncate">
        {{ item.schema.label }} {{ item.schema.operator || ":" }} {{ item.value }}
      </span>
    </slot>
    <button
      class="rounded-md p-0.5 hover:bg-black/10"
      type="button"
      aria-label="移除条件"
      @click.stop="emit('removeItem', { id: item.id })"
    >
      <X class="size-3" />
    </button>
  </span>
</template>
