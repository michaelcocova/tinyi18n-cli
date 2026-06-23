<script setup lang="ts">
import type { InputSearchBoxSchema } from '../types'
import { get, set } from 'lodash-es'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSearchBoxStore } from '../useSearchBox'

const emit = defineEmits<{
  (event: 'confirm', value: string): void
}>()
const { input, activeSchema } = useSearchBoxStore()
const inputSchema = computed(() =>
  activeSchema.value?.type === 'input'
    ? activeSchema.value as InputSearchBoxSchema
    : undefined,
)

const component = computed({
  get() {
    return get(input.value, get(inputSchema.value, 'field', ''), '')
  },
  set(value) {
    if (get(inputSchema.value, 'field', '')) {
      set(input.value, get(inputSchema.value, 'field', ''), value)
    }
  },
})

const message = ref('')
watch(
  () => component.value,
  async () => {
    if (!inputSchema.value)
      return
    const res = inputSchema.value.validator?.(z)
    if (!res) {
      message.value = ''
      return
    }
    const value = component.value
    const parsed = await res.safeParseAsync(value)
    message.value = parsed.success ? '' : (parsed.error?.message || '')
  },
  { immediate: true },
)

function handleConfirm() {
  const schema = inputSchema.value
  if (!schema)
    return
  const value = String(component.value ?? '').trim()
  if (!value)
    return
  if (message.value)
    return
  emit('confirm', value)
}
</script>

<template>
  <div
    v-if="inputSchema"
    class="space-y-2"
  >
    <Input
      v-model="component"
      :placeholder="inputSchema.placeholder || '请输入'"
      @keydown.enter.stop.prevent="handleConfirm"
    />
    <div
      v-if="message"
      class="text-xs text-destructive"
    >
      {{ message }}
    </div>
    <div class="flex justify-end">
      <Button
        size="sm"
        class="h-7 px-3 text-xs font-normal"
        :disabled="Boolean(message) || !String(component ?? '').trim()"
        @click="handleConfirm"
      >
        确定
      </Button>
    </div>
  </div>
</template>

<style scoped>

</style>
