import { createGlobalState } from '@vueuse/core'
import { markRaw, ref } from 'vue'

import SyncSuccessToast from '../../components/workspace/SyncSuccessToast.vue'
import { toast } from '../../utils/toast.ts'
import { getWebConfig } from '../../web-config.ts'
import { useSaveQueue } from './useSaveQueue.ts'

interface TinyI18nSyncResult {
  ok: true
  files: string[]
  skipped: Array<{
    id: string
    path: string
    reason: string
  }>
}

export const useProjectFileSync = createGlobalState(() => {
  const webConfig = getWebConfig()
  const { flush } = useSaveQueue()
  const isSyncing = ref(false)
  const lastSyncedAt = ref<number>()
  const error = ref('')

  async function sync() {
    isSyncing.value = true
    error.value = ''

    try {
      await flush()

      const response = await fetch(`${webConfig.apiBase}/data/sync`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => null)
        throw new Error(
          errData?.message
          || response.statusText
          || `Request failed: ${response.status}`,
        )
      }

      const result = (await response.json()) as TinyI18nSyncResult
      lastSyncedAt.value = Date.now()
      toast.dismiss()
      toast.custom(markRaw(SyncSuccessToast), {
        componentProps: {
          files: result.files,
          skipped: result.skipped,
        },
        closeButton: true,
        duration: 3000,
        position: 'bottom-right',
      })

      return result
    }
    catch (syncError) {
      error.value
        = syncError instanceof Error ? syncError.message : String(syncError)

      toast.error('生成项目文件失败', {
        description: error.value,
      })

      throw syncError
    }
    finally {
      isSyncing.value = false
    }
  }

  return {
    isSyncing,
    lastSyncedAt,
    error,
    sync,
  }
})
