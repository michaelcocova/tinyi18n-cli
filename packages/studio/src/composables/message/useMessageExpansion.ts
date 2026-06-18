import { createGlobalState } from '@vueuse/core'
import { computed } from 'vue'
import { useTinyI18nDocument } from '../core/useTinyI18nDocument.ts'
import { useTreeExpansionState } from '../tree/useTreeExpansionState.ts'
import { useMessageTree } from './useMessageTree.ts'

export const useMessageExpansion = createGlobalState(() => {
  const { document } = useTinyI18nDocument()
  const { tree } = useMessageTree()
  return useTreeExpansionState(tree, {
    defaultExpandedDepth: 1,
    ready: computed(() => document.value.hasLoaded),
  })
})
