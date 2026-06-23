import type { SearchBoxSchema, SearchBoxSchemas } from './types'
import { createInjectionState } from '@vueuse/core'

const [useProvideSearchBoxStore, _useSearchBoxStore] = createInjectionState((inputSchemas: Ref<SearchBoxSchemas>) => {
  // 搜索框的 schemas
  const schemas = computed(() => inputSchemas.value)
  // 添加按钮状态
  const addBtnState = reactive({
    visible: false,
    hidden: false,
  })

  const input = ref<Recordable>({})
  const activeSchema = ref<SearchBoxSchema>()
  function clearInput() {
    input.value = {}
  }
  function onActiveSchema(schema: SearchBoxSchema) {
    clearInput()
    activeSchema.value = schema
  }
  function clearActiveSchema() {
    clearInput()
    setTimeout(() => {
      activeSchema.value = void 0
    }, 150)
  }

  return { input, schemas, addBtnState, onActiveSchema, clearActiveSchema, activeSchema, clearInput }
})

export { useProvideSearchBoxStore }

export function useSearchBoxStore() {
  const store = _useSearchBoxStore()
  if (store == null) {
    throw new Error(
      '请在父组件中调用 `useProvideSearchBoxStore` 以提供 SearchBoxStore 实例',
    )
  }
  return store
}
