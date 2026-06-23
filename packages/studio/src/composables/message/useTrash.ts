import type { TinyI18nItem } from '../../../../cli/src/core/message.ts'
import { createGlobalState } from '@vueuse/core'
import { computed } from 'vue'
import { useDataCenter } from '../data-center/useDataCenter.ts'
import { useFactoryCenter } from '../factory-center/useFactoryCenter.ts'

export const useTrash = createGlobalState(() => {
  const dataCenter = useDataCenter()

  const treeState = useFactoryCenter(
    computed(() => dataCenter.trash.value as unknown as TinyI18nItem[]),
    {
      ready: computed(() => dataCenter.state.value.hasTrashLoaded),
      defaultExpandedDepth: 'infinite',
    },
  )

  async function restoreItems(ids: string[]) {
    await dataCenter.commit({ type: 'restore', data: { ids } })
  }

  async function permanentlyDeleteItems(ids: string[]) {
    await dataCenter.commit({ type: 'permanent_delete', data: { ids } })
  }

  return {
    ...treeState,
    load: dataCenter.loadTrash,
    restoreItems,
    permanentlyDeleteItems,
  }
})
