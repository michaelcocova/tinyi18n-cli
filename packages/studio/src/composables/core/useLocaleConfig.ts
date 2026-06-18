import { createGlobalState } from '@vueuse/core'
import { computed } from 'vue'
import { useTinyI18nDocument } from './useTinyI18nDocument.ts'

export const useLocaleConfig = createGlobalState(() => {
  const { document } = useTinyI18nDocument()

  const localeConfig = computed(() => {
    const config = document.value.config
    const locales = config?.locales ?? []
    const defaultLocale = config?.defaultLocale
    const defaultLocaleConfig = locales.find(
      item => item.code === defaultLocale,
    )

    return {
      locales,
      defaultLocale,
      defaultLocaleConfig,
    }
  })

  return {
    localeConfig,
  }
})
