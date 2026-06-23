<script setup lang="ts">
import { useSearchBoxStore } from '../useSearchBox'

const emit = defineEmits<{
  (event: 'confirm', value: string | string[]): void
  (event: 'cancel'): void
}>()

const { activeSchema } = useSearchBoxStore()

</script>

<template>
  <div v-if="activeSchema?.type === 'custom'">
    <slot
      :schema="activeSchema"
      :confirm="(value: string | string[]) => emit('confirm', value)"
      :cancel="() => emit('cancel')"
      :close="() => emit('cancel')"
    />
  </div>
</template>
