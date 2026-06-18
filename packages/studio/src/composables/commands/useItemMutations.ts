import { createGlobalState } from '@vueuse/core'
import { nanoid } from 'nanoid'
import { useLocaleConfig } from '../core/useLocaleConfig.ts'
import { useTinyI18nDocument } from '../core/useTinyI18nDocument.ts'
import { useMessageTree } from '../message/useMessageTree.ts'
import { useSaveQueue } from './useSaveQueue.ts'

export const useItemMutations = createGlobalState(() => {
  const { commit } = useTinyI18nDocument()
  const { tree } = useMessageTree()
  const { localeConfig } = useLocaleConfig()
  const { flush } = useSaveQueue()

  async function createGroup(parentId?: string) {
    if (parentId) {
      const parent = tree.value.byId.get(parentId)
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
    await commit({
      type: 'create',
      data: nextItem,
    })

    return nextItem
  }

  async function createMessage(parentId?: string) {
    let targetParentId = parentId

    if (parentId) {
      const parent = tree.value.byId.get(parentId)
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
    await commit({
      type: 'create',
      data: nextItem,
    })

    return nextItem
  }

  async function removeItems(ids: string[]) {
    await flush()
    await commit({
      type: 'delete',
      data: { ids },
    })
  }

  async function moveItems(ids: string[], parent?: string) {
    await flush()
    await commit({
      type: 'move',
      data: {
        ids,
        parent,
      },
    })
  }

  return {
    createGroup,
    createMessage,
    removeItems,
    moveItems,
  }
})
