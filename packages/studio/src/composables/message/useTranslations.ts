import type { TinyI18nGroup, TinyI18nItem, TinyI18nMessage } from '../../../../cli/src/core/message.ts'
import { createGlobalState } from '@vueuse/core'
import { nanoid } from 'nanoid'
import { computed } from 'vue'
import { toast } from '../../utils/toast.ts'
import { useSaveQueue } from '../commands/useSaveQueue.ts'
import { useLocaleConfig } from '../core/useLocaleConfig.ts'
import { useDataCenter } from '../data-center/useDataCenter.ts'
import { useFactoryCenter } from '../factory-center/useFactoryCenter.ts'

export const useTranslations = createGlobalState(() => {
  const dataCenter = useDataCenter()
  const { localeConfig } = useLocaleConfig()
  const { flush } = useSaveQueue()

  // 1. Core Tree State
  const treeState = useFactoryCenter(
    computed(() => dataCenter.items.value as unknown as TinyI18nItem[]),
    {
      ready: computed(() => dataCenter.state.value.hasLoaded),
      defaultExpandedDepth: 1,
      locales: computed(() => localeConfig.value.locales.map(item => item.code)),
      defaultLocale: computed(() => localeConfig.value.defaultLocale),
    },
  )

  // 2. Filter（与 SearchBox v-model 对齐的对象格式）
  const filterState = treeState.filter.filterState
  const availableLocales = treeState.filter.availableLocales

  function clearAllFilters() {
    filterState.value = {
      query: '',
      pathFilter: [],
      localeScope: [],
      issues: [],
    }
  }

  // 3. CRUD Operations
  async function createGroup(parentId?: string) {
    if (parentId) {
      const parent = treeState.tree.value.byId.get(parentId)
      if (!parent || parent.original.type === 'message') {
        return
      }
    }

    const nextItem: TinyI18nGroup = {
      id: nanoid(28),
      type: 'group',
      parent: parentId,
      key: '',
      title: '',
    }

    await flush()
    await treeState.operation({
      type: 'create',
      data: nextItem,
    })

    return nextItem
  }

  async function createMessage(parentId?: string) {
    let targetParentId = parentId

    if (parentId) {
      const parent = treeState.tree.value.byId.get(parentId)
      if (!parent) {
        return
      }
      targetParentId
        = parent.original.type === 'message' ? parent.original.parent : parent.id
    }

    const nextItem: TinyI18nMessage = {
      id: nanoid(28),
      type: 'message',
      parent: targetParentId,
      key: '',
      translations: {
        [localeConfig.value.defaultLocale || 'zh-CN']: '',
      },
    }

    await flush()
    await treeState.operation({
      type: 'create',
      data: nextItem,
    })

    return nextItem
  }

  async function removeItems(ids: string[]) {
    await flush()
    await treeState.operation({
      type: 'delete',
      data: { ids },
    })

    toast('已移至最近删除', {
      duration: 5000,
      action: {
        label: '撤销',
        onClick: async () => {
          await treeState.operation({
            type: 'restore',
            data: { ids },
          })
        },
      },
    })
  }

  async function moveItems(ids: string[], parent?: string) {
    await flush()
    await treeState.operation({
      type: 'move',
      data: {
        ids,
        parent,
      },
    })
  }

  return {
    // tree/expand/select/check（沿用旧 useLocaleTree 的使用方式）
    tree: treeState.tree,
    expandedIds: treeState.expandedIds,
    isExpanded: treeState.state.isExpanded,
    toggleExpanded: treeState.state.toggleExpanded,

    selectedId: treeState.selectedId,
    selectedNode: treeState.selectedNode,
    isSelected: treeState.state.isSelected,
    select: (id?: string) => {
      if (!id || !treeState.tree.value.byId.has(id)) {
        treeState.selectedId.value = ''
        return
      }
      const nextSelected = treeState.selectedId.value !== id
      treeState.state.toggleSelected(id, nextSelected)
    },

    checkedIds: treeState.checkedIds,
    isChecked: treeState.state.isChecked,
    isIndeterminate: treeState.state.isIndeterminate,
    toggleChecked: treeState.state.toggleChecked,
    clearChecked: () => {
      treeState.checkedIds.value = new Set()
    },

    // Search
    matchedIds: treeState.filter.matchedIds,
    filterState,
    availableLocales,
    clearAllFilters,

    // CRUD（给 workspace 用）
    createGroup,
    createMessage,
    removeItems,
    moveItems,
  }
})
