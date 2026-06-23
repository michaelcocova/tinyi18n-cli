<script setup lang="ts">
import type { ToggleSearchBoxSchema } from '../types'
import { computed, isVNode } from 'vue'
import { Button } from '@/components/ui/button'
import { useSearchBoxStore } from '../useSearchBox'

const emit = defineEmits<{
  (event: 'confirm'): void
}>()
const { activeSchema } = useSearchBoxStore()
const toggleSchema = computed(() =>
  activeSchema.value?.type === 'toggle'
    ? activeSchema.value as ToggleSearchBoxSchema
    : undefined,
)

const renderedDescription = computed(() => {
  const description = toggleSchema.value?.description
  if (!description)
    return null
  if (typeof description === 'function') {
    return description()
  }
  if (isVNode(description)) {
    return description
  }
  return null
})
</script>

<template>
  <div
    v-if="toggleSchema?.description"
    class="space-y-3"
  >
    <div class="text-sm font-medium">
      {{ toggleSchema.label }}
    </div>
    <div
      v-if="typeof toggleSchema.description === 'string'"
      class="text-sm text-muted-foreground"
    >
      {{ toggleSchema.description }}
    </div>
    <component
      :is="{ render: () => renderedDescription }"
      v-else-if="renderedDescription"
    />
    <div class="flex justify-end">
      <Button
        size="sm"
        class="h-7 px-3 text-xs font-normal"
        @click="emit('confirm')"
      >
        确定
      </Button>
    </div>
  </div>
</template>
