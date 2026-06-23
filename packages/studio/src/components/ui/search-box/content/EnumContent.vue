<script setup lang="ts">
import type { EnumSearchBoxSchema, SearchBoxOption } from '../types'
import { Check } from '@lucide/vue'
import { get, set } from 'lodash-es'
import { computed, isVNode } from 'vue'
import { Button } from '@/components/ui/button'
import { useSearchBoxStore } from '../useSearchBox'

const emit = defineEmits<{
  (event: 'confirm', value: string | string[]): void
}>()

const { input, activeSchema } = useSearchBoxStore()

const enumSchema = computed(() =>
  activeSchema.value?.type === 'enum'
    ? activeSchema.value as EnumSearchBoxSchema
    : undefined,
)

const isMulti = computed(() => enumSchema.value?.mode === 'multi')

const selected = computed<string[] | string>({
  get() {
    const field = enumSchema.value?.field
    if (!field)
      return isMulti.value ? [] : ''
    const value = get(input.value, field)
    if (isMulti.value)
      return Array.isArray(value) ? value : []
    return typeof value === 'string' ? value : ''
  },
  set(value) {
    const field = enumSchema.value?.field
    if (!field)
      return
    set(input.value, field, value)
  },
})

function resolveOptionValue(option: SearchBoxOption) {
  const key = enumSchema.value?.optionValueKey
  if (key && (option as any)?.[key] !== undefined) {
    return String((option as any)[key])
  }
  return String(option.value ?? option.label)
}

function renderOptionDescription(option: SearchBoxOption) {
  const desc = option.description
  if (!desc)
    return null
  if (typeof desc === 'function')
    return desc()
  if (isVNode(desc))
    return desc
  return null
}

function toggleValue(value: string) {
  const current = Array.isArray(selected.value) ? selected.value : []
  selected.value = current.includes(value)
    ? current.filter(item => item !== value)
    : [...current, value]
}

function handleSelect(option: SearchBoxOption) {
  const value = resolveOptionValue(option)
  if (!value)
    return

  if (isMulti.value) {
    toggleValue(value)
    return
  }

  emit('confirm', value)
}

function handleConfirm() {
  if (!isMulti.value)
    return
  const current = Array.isArray(selected.value) ? selected.value : []
  if (!current.length)
    return
  emit('confirm', current)
}
</script>

<template>
  <div
    v-if="enumSchema"
    class="space-y-3"
  >
    <div class="max-h-72 overflow-y-auto rounded-md border">
      <button
        v-for="(option, index) in enumSchema.options ?? []"
        :key="`${resolveOptionValue(option)}-${index}`"
        type="button"
        class="flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="option.disabled"
        @click="handleSelect(option)"
      >
        <div class="min-w-0 flex-1">
          <div class="truncate">
            {{ option.label }}
          </div>
          <div
            v-if="typeof option.description === 'string'"
            class="mt-0.5 line-clamp-2 text-xs text-muted-foreground"
          >
            {{ option.description }}
          </div>
          <component
            :is="{ render: () => renderOptionDescription(option) }"
            v-else-if="renderOptionDescription(option)"
          />
        </div>
        <Check
          v-if="Array.isArray(selected) ? selected.includes(resolveOptionValue(option)) : selected === resolveOptionValue(option)"
          class="mt-0.5 size-4 shrink-0 text-primary"
        />
      </button>
    </div>

    <div
      v-if="isMulti"
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
