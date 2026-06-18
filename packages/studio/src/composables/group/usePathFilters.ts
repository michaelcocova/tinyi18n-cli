import type {
  TinyI18nPathFilter,
  TinyI18nPathFilterMode,
} from '../path-query.ts'
import { createGlobalState } from '@vueuse/core'
import { nanoid } from 'nanoid'
import { ref } from 'vue'
import { normalizePathQuery } from '../path-query.ts'
import { useGroupTree } from './useGroupTree.ts'

export const usePathFilters = createGlobalState(() => {
  const { tree } = useGroupTree()
  const filters = ref<TinyI18nPathFilter[]>([])

  function addFilter(mode: TinyI18nPathFilterMode, query: string) {
    const normalizedQuery = normalizePathQuery(query)
    if (
      !normalizedQuery
      || filters.value.some(
        filter => filter.mode === mode && filter.query === normalizedQuery,
      )
    ) {
      return
    }

    filters.value = [
      ...filters.value,
      {
        id: nanoid(28),
        mode,
        query: normalizedQuery,
      },
    ]
  }

  function addFromGroup(mode: TinyI18nPathFilterMode, groupId: string) {
    const node = tree.value.byId.get(groupId)
    if (!node || node.original.type !== 'group') {
      return
    }

    addFilter(mode, `$.${node.meta.path}`)
  }

  function removeFilter(id: string) {
    filters.value = filters.value.filter(filter => filter.id !== id)
  }

  function clearFilters() {
    filters.value = []
  }

  return {
    filters,
    addFromGroup,
    removeFilter,
    clearFilters,
  }
})
