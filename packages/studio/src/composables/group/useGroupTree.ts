import type { TinyI18nGroup, TinyI18nItem } from '../../../../cli/src/core/message.ts'
import { createGlobalState } from '@vueuse/core'
import { computed } from 'vue'
import { useDataCenter } from '../data-center/useDataCenter.ts'
import { buildMessageTree } from '../factory-center/buildMessageTree.ts'

export const useGroupTree = createGlobalState(() => {
  const { items } = useDataCenter()
  const tree = computed(() =>
    buildMessageTree(
      items.value.filter((item): item is TinyI18nGroup => item.type === 'group') as unknown as TinyI18nItem[],
    ),
  )

  return {
    tree,
  }
})
