import { createGlobalState } from '@vueuse/core'
import { useTinyI18nDocument } from '../core/useTinyI18nDocument.ts'
import { useSaveQueue } from './useSaveQueue.ts'

export const useItemEditor = createGlobalState(() => {
  const { push } = useSaveQueue()
  const { applyLocalOperation } = useTinyI18nDocument()

  async function renameKey(id: string, key: string) {
    const operation: TinyI18nOperation = {
      type: 'update',
      data: {
        id,
        patch: { key },
      },
    }

    await applyLocalOperation(operation)
    push(operation)
  }

  async function renameTitle(id: string, title: string) {
    const operation: TinyI18nOperation = {
      type: 'update',
      data: {
        id,
        patch: { title } as Partial<TinyI18nItem>,
      },
    }

    await applyLocalOperation(operation)
    push(operation)
  }

  async function setTranslation(id: string, locale: string, value: string) {
    const operation: TinyI18nOperation = {
      type: 'update',
      data: {
        id,
        patch: {
          translations: {
            [locale]: value,
          },
        } as Partial<TinyI18nItem>,
      },
    }

    await applyLocalOperation(operation)
    push(operation)
  }

  return {
    renameKey,
    renameTitle,
    setTranslation,
  }
})
