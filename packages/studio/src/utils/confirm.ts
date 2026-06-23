import type { ConfirmToastVariant } from '@/components/ui/confirm-toast/ConfirmToast.vue'
import { markRaw } from 'vue'
import ConfirmToast from '@/components/ui/confirm-toast/ConfirmToast.vue'
import { toast } from '@/utils/toast'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: ConfirmToastVariant
}

/**
 * 用 toast.custom 实现的二次确认：
 * - 返回 Promise<boolean>
 * - resolve(true) 表示确认，resolve(false) 表示取消/关闭
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  const id = crypto.randomUUID()

  return new Promise((resolve) => {
    function finish(result: boolean) {
      toast.dismiss(id)
      resolve(result)
    }

    toast.custom(markRaw(ConfirmToast), {
      id,
      duration: Number.POSITIVE_INFINITY,
      closeButton: false,
      position: 'top-center',
      componentProps: {
        ...options,
        onConfirm: () => finish(true),
        onCancel: () => finish(false),
      },
    })
  })
}
