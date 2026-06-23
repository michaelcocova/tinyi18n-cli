import { createGlobalState } from '@vueuse/core'
import { computed } from 'vue'
import { useDataCenter } from '../data-center/useDataCenter.ts'
import { useTreeExpansionState } from '../factory-center/useTreeExpansionState.ts'
import { useGroupTree } from './useGroupTree.ts'

export const useGroupMoveExpansion = createGlobalState(() => {
  const { state } = useDataCenter()
  const { tree } = useGroupTree()
  return useTreeExpansionState(tree, {
    defaultExpandedDepth: 'infinite',
    ready: computed(() => state.value.hasLoaded),
  })
})
