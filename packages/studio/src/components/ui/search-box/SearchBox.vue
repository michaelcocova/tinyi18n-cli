<script setup lang="ts">
import type { SearchBoxBeforeUpdate, SearchBoxModelValue, SearchBoxSchema, SearchBoxSchemas } from './types.ts'
import { computed, ref, watchEffect } from 'vue'
import SearchBoxAddMenu from './SearchBoxAddMenu.vue'
import SearchBoxTagList from './SearchBoxTagList.vue'
import { useProvideSearchBoxStore } from './useSearchBox.ts'

const props = withDefaults(defineProps<{
  items?: SearchBoxSchemas
  modelValue?: SearchBoxModelValue
  beforeUpdate?: SearchBoxBeforeUpdate
}>(), {
  items: () => [],
  modelValue: () => ({}),
  beforeUpdate: undefined,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: SearchBoxModelValue): void
  (event: 'change', value: SearchBoxModelValue, oldValue: SearchBoxModelValue): void
}>()

useProvideSearchBoxStore(toRef(props, 'items'))

function cloneModel(value: SearchBoxModelValue) {
  return JSON.parse(JSON.stringify(value ?? {})) as SearchBoxModelValue
}

function emitModel(next: SearchBoxModelValue, context: Parameters<SearchBoxBeforeUpdate>[2]) {
  const prev = cloneModel(props.modelValue ?? {})
  const nextCloned = cloneModel(next)
  const finalValue = props.beforeUpdate
    ? props.beforeUpdate(nextCloned, prev, context)
    : nextCloned

  emit('update:modelValue', cloneModel(finalValue))
  emit('change', cloneModel(finalValue), prev)
}

function normalizeToArray(value: any): string[] {
  if (Array.isArray(value))
    return value.map(v => String(v)).filter(Boolean)
  if (value === undefined || value === null)
    return []
  const s = String(value)
  return s ? [s] : []
}

function normalizeRenderValues(schema: SearchBoxSchema, value: any): string[] {
  if (schema.type === 'toggle')
    return normalizeToArray(value ? '是' : '')

  const keepsArrayShape
    = (schema.type === 'custom' && schema.repeatable)
      || (schema.type === 'enum' && schema.mode === 'multi')
      || (schema.type === 'select' && schema.multiple)

  return normalizeToArray(keepsArrayShape ? value : String(value ?? ''))
}

function normalizeFieldValue(schema: SearchBoxSchema, value: any) {
  if (schema.type === 'toggle')
    return Boolean(value)

  const keepsArrayShape
    = (schema.type === 'enum' && schema.mode === 'multi')
      || (schema.type === 'select' && schema.multiple)

  return keepsArrayShape ? normalizeToArray(value) : String(value ?? '')
}

interface RenderItem {
  id: string
  field: string
  value: string
}

function createId() {
  // 运行环境可能没有 crypto.randomUUID 的 polyfill，所以做个兜底
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toKey(field: string, value: string) {
  return `${field}::${value}`
}

const schemaMap = computed(() => {
  const map = new Map<string, SearchBoxSchema>()
  for (const schema of props.items ?? []) {
    map.set(schema.field, schema)
  }
  return map
})

const renderItems = ref<RenderItem[]>([])

function collectDesiredCounts(model: SearchBoxModelValue) {
  const counts = new Map<string, number>()

  for (const schema of props.items ?? []) {
    const raw = (model as any)?.[schema.field]

    if (schema.type === 'input') {
      const value = String(raw ?? '').trim()
      if (!value)
        continue
      const key = toKey(schema.field, value)
      counts.set(key, (counts.get(key) ?? 0) + 1)
      continue
    }

    if (schema.type === 'toggle' || schema.type === 'select' || schema.type === 'enum' || schema.type === 'custom') {
      const values = normalizeRenderValues(schema, raw)
      for (const v of values) {
        const key = toKey(schema.field, v)
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
      continue
    }
  }

  return counts
}

function syncRenderItemsFromModel() {
  const model = props.modelValue ?? {}
  const desired = collectDesiredCounts(model)

  // 1) 保留现有顺序，能匹配上的就留下（按次数）
  const nextItems: RenderItem[] = []
  for (const item of renderItems.value) {
    const key = toKey(item.field, item.value)
    const left = desired.get(key) ?? 0
    if (left <= 0)
      continue
    desired.set(key, left - 1)
    nextItems.push(item)
  }

  // 2) 把缺的补到末尾（按 schema 顺序补，避免完全随机）
  for (const schema of props.items ?? []) {
    // 遍历 desired 中属于这个 field 的 key
    for (const [key, left] of desired.entries()) {
      if (left <= 0)
        continue
      if (!key.startsWith(`${schema.field}::`))
        continue
      const value = key.slice(`${schema.field}::`.length)
      for (let i = 0; i < left; i++) {
        nextItems.push({ id: createId(), field: schema.field, value })
      }
      desired.set(key, 0)
    }
  }

  renderItems.value = nextItems
}

watchEffect(() => {
  // 当外部 modelValue / items 变化时，保证渲染列表能对齐（同时尽量保留当前顺序）
  syncRenderItemsFromModel()
})

const renderedList = computed(() => {
  return renderItems.value
    .map((item) => {
      const schema = schemaMap.value.get(item.field)
      if (!schema)
        return undefined
      return { ...item, schema }
    })
    .filter((item): item is (RenderItem & { schema: SearchBoxSchema }) => Boolean(item))
})

function applyFieldValue(schema: SearchBoxSchema, value: any) {
  const next = cloneModel(props.modelValue ?? {})

  if (schema.type === 'custom') {
    if (schema.repeatable) {
      const current = normalizeToArray(next[schema.field])
      const incoming = normalizeToArray(value)
      next[schema.field] = [...current, ...incoming]
    }
    else {
      next[schema.field] = String(value ?? '')
    }
  }
  else {
    next[schema.field] = normalizeFieldValue(schema, value)
  }

  // 更新渲染数组（顺序即最终展示顺序）
  const incomingValues = normalizeRenderValues(schema, value)

  // 非 repeatable：先移除同 field 的旧渲染，再追加新渲染（多值则按数组顺序追加）
  if (schema.repeatable !== true) {
    renderItems.value = renderItems.value.filter(item => item.field !== schema.field)
  }
  for (const v of incomingValues.filter(Boolean)) {
    renderItems.value.push({ id: createId(), field: schema.field, value: String(v) })
  }

  emitModel(next, { action: 'add' })
}

function removeRenderItem(payload: { id: string }) {
  const item = renderItems.value.find(x => x.id === payload.id)
  if (!item)
    return
  const schema = schemaMap.value.get(item.field)
  if (!schema)
    return

  const next = cloneModel(props.modelValue ?? {})
  if (schema.type === 'toggle') {
    next[schema.field] = false
  }
  else if (schema.type === 'enum' && schema.mode === 'multi') {
    const list = normalizeToArray(next[schema.field])
    const index = list.indexOf(item.value)
    if (index >= 0)
      list.splice(index, 1)
    next[schema.field] = list
  }
  else if (schema.type === 'select' && schema.multiple) {
    const list = normalizeToArray(next[schema.field])
    const index = list.indexOf(item.value)
    if (index >= 0)
      list.splice(index, 1)
    next[schema.field] = list
  }
  else if (schema.type === 'custom' && schema.repeatable) {
    const list = normalizeToArray(next[schema.field])
    const index = list.indexOf(item.value)
    if (index >= 0)
      list.splice(index, 1)
    next[schema.field] = list
  }
  else {
    delete next[schema.field]
  }

  renderItems.value = renderItems.value.filter(x => x.id !== payload.id)
  emitModel(next, { action: 'remove' })
}
</script>

<template>
  <div class="flex items-center flex-wrap gap-2">
    <SearchBoxTagList
      :items="renderedList"
      @remove-item="removeRenderItem"
    >
      <template #tag="slotProps">
        <slot
          name="tag"
          v-bind="slotProps"
        />
      </template>
    </SearchBoxTagList>

    <SearchBoxAddMenu
      :model-value="props.modelValue ?? {}"
      @confirm="({ schema, value }) => applyFieldValue(schema, value)"
    >
      <template #default="slotProps">
        <slot
          :name="slotProps.schema.slotName ?? slotProps.schema.field"
          v-bind="slotProps"
        />
      </template>
    </SearchBoxAddMenu>
  </div>
</template>

<style scoped></style>
