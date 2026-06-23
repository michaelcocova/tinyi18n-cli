<script setup lang="ts">
import type { SelectSearchBoxSchema } from '../types'
import { Check } from '@lucide/vue'
import { get, set } from 'lodash-es'
import { Button } from '@/components/ui/button'
import { useSearchBoxStore } from '../useSearchBox'

const emit = defineEmits<{
  (event: 'confirm', value: string | string[]): void
}>()
const { input, activeSchema } = useSearchBoxStore()
const selectSchema = computed(() =>
  activeSchema.value?.type === 'select'
    ? activeSchema.value as SelectSearchBoxSchema
    : undefined,
)

const selected = computed<string[] | string>({
  get() {
    const field = selectSchema.value?.field
    if (!field)
      return selectSchema.value?.multiple ? [] : ''
    const value = get(input.value, field)
    if (selectSchema.value?.multiple) {
      return Array.isArray(value) ? value : []
    }
    return typeof value === 'string' ? value : ''
  },
  set(value) {
    const field = selectSchema.value?.field
    if (!field)
      return
    set(input.value, field, value)
  },
})

function resolveOptionValue(option: any) {
  const key = selectSchema.value?.optionValueKey
  if (key && option?.[key] !== undefined) {
    return String(option[key])
  }
  return String(option?.value ?? option?.label ?? '')
}

function toggleValue(value: string) {
  const current = Array.isArray(selected.value) ? selected.value : []
  selected.value = current.includes(value)
    ? current.filter(item => item !== value)
    : [...current, value]
}

function handleSelect(option: any) {
  const value = resolveOptionValue(option)
  if (!value)
    return
  if (selectSchema.value?.multiple) {
    toggleValue(value)
    return
  }
  emit('confirm', value)
}

function handleConfirm() {
  if (!selectSchema.value?.multiple)
    return
  const current = Array.isArray(selected.value) ? selected.value : []
  if (!current.length)
    return
  emit('confirm', current)
}
</script>

<template>
  <div
    v-if="selectSchema"
    class="space-y-3"
  >
    <div class="max-h-72 overflow-y-auto rounded-md border">
      <button
        v-for="(option, index) in selectSchema.options ?? []"
        :key="`${resolveOptionValue(option)}-${index}`"
        type="button"
        class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="option.disabled"
        @click="handleSelect(option)"
      >
        <span>{{ option.label }}</span>
        <Check
          v-if="Array.isArray(selected) ? selected.includes(resolveOptionValue(option)) : selected === resolveOptionValue(option)"
          class="size-4 text-primary"
        />
      </button>
    </div>

    <div
      v-if="selectSchema.multiple"
      class="flex justify-end"
    >
      <Button
        size="sm"
        class="h-7 px-3 text-xs font-normal"
        :disabled="!Array.isArray(selected) || !selected.length"
        @click="handleConfirm"
      >
        确定
      </Button>
    </div>
  </div>
</template>
