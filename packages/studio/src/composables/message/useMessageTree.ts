import { createGlobalState } from '@vueuse/core'
import { computed } from 'vue'
import { useTinyI18nDocument } from '../core/useTinyI18nDocument.ts'
import { buildMessageTree } from '../tree/buildMessageTree.ts'

export const useMessageTree = createGlobalState(() => {
  const { document } = useTinyI18nDocument()
  const tree = computed(() => buildMessageTree(document.value.items))

  return {
    tree,
  }
})
