import { createGlobalState } from '@vueuse/core'
import { computed } from 'vue'
import { getLanguageLabel } from '../../constants/language.ts'
import { useDataCenter } from '../data-center/useDataCenter.ts'

export const useLocaleConfig = createGlobalState(() => {
  const { config } = useDataCenter()

  const localeConfig = computed(() => {
    // CLI 的 resolved config 里 locale 只有 code/filename；
    // Studio 侧补一个 label 方便展示（优先使用内置语言名，否则回落到 code）。
    const locales = (config.value?.locales ?? []).map((item) => {
      return {
        ...item,
        label: getLanguageLabel(item.code) ?? item.code,
      }
    })
    const defaultLocale = config.value?.defaultLocale
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
