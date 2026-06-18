<script setup lang="ts">
import {
  CircleAlert,
  Database,
  FileCode2,
  Languages,
  RefreshCw,
  Sparkles,
} from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { useLocaleConfig } from '@/composables/core/useLocaleConfig'
import { useTinyI18nDocument } from '@/composables/core/useTinyI18nDocument'
import { useQualityCheck } from '@/composables/quality/useQualityCheck'
import { getLanguageLabel } from '@/constants/language'

interface DashboardParseRow {
  badge: string
  badgeClass: string
  value: string
  meta: string
}

interface DashboardSummaryCard {
  label: string
  value: string
  icon: unknown
  title: string
  description: string
}

const { document, load } = useTinyI18nDocument()
const { localeConfig } = useLocaleConfig()
const { report, isScanning, error: qualityError } = useQualityCheck()

const numberFormatter = new Intl.NumberFormat('zh-CN')

onMounted(() => {
  void load()
})

const items = computed<TinyI18nItem[]>(() => document.value.items)

const groups = computed<TinyI18nGroup[]>(() =>
  items.value.filter((item): item is TinyI18nGroup => item.type === 'group'),
)

const messages = computed<TinyI18nMessage[]>(() =>
  items.value.filter(
    (item): item is TinyI18nMessage => item.type === 'message',
  ),
)

const groupCount = computed(() => groups.value.length)
const messageCount = computed(() => messages.value.length)
const localeItems = computed<TinyI18nLocaleConfig[]>(
  () => localeConfig.value.locales,
)
const localeCount = computed(() => localeItems.value.length)
const entryCount = computed(() => document.value.config?.entries?.length ?? 0)
const dataFilename = computed(
  () => document.value.config?.filename ?? '.data.json',
)
const issueCount = computed<number>(() => {
  const counts = report.value.counts
  return (
    counts.missing_key
    + counts.missing_translation
    + counts.empty_translation
    + counts.duplicate_path_global
    + counts.duplicate_path_group
  )
})

const workspaceStatus = computed(() => {
  if (document.value.error || qualityError.value) {
    return '异常'
  }

  if (document.value.isLoading) {
    return '加载中'
  }

  if (isScanning.value) {
    return '扫描中'
  }

  if (document.value.snapshot?.initialized) {
    return '就绪'
  }

  return '未初始化'
})

const defaultLocaleLabel = computed(() => {
  const code = localeConfig.value.defaultLocale
  return (
    localeConfig.value.defaultLocaleConfig?.label
    || getLanguageLabel(code)
    || code
    || '未设置'
  )
})

const defaultLocaleFilename = computed(
  () => localeConfig.value.defaultLocaleConfig?.filename ?? '未设置',
)

const workspaceInputs = computed<string[]>(() => [
  '.tinyi18n/config.ts',
  `.tinyi18n/${dataFilename.value}`,
  ...localeItems.value.map(item => item.filename),
])

const parseRows = computed<DashboardParseRow[]>(() => [
  {
    badge: '配置',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    value: document.value.snapshot?.initialized
      ? '.tinyi18n/config.ts 已加载'
      : '等待初始化工作区',
    meta: document.value.snapshot?.initialized ? '就绪' : '未就绪',
  },
  {
    badge: '快照',
    badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    value: `已索引 ${numberFormatter.format(messageCount.value)} 条消息`,
    meta: `.tinyi18n/${dataFilename.value}`,
  },
  {
    badge: '语言',
    badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    value: defaultLocaleFilename.value,
    meta: defaultLocaleLabel.value,
  },
  {
    badge: '扫描',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    value: isScanning.value
      ? '正在执行质量扫描'
      : `待处理 ${numberFormatter.format(issueCount.value)} 项`,
    meta: qualityError.value || '质量检查',
  },
])

const summaryCards = computed<DashboardSummaryCard[]>(() => [
  {
    label: '已索引键',
    value: numberFormatter.format(messageCount.value),
    icon: Database,
    title: '快照索引',
    description: `当前工作区共有 ${numberFormatter.format(groupCount.value)} 个分组。`,
  },
  {
    label: '配置来源',
    value: 'config.ts',
    icon: FileCode2,
    title: '配置解析',
    description: `已读取 ${entryCount.value} 个 entries，默认语言为 ${defaultLocaleLabel.value}。`,
  },
  {
    label: '语言文件',
    value: numberFormatter.format(localeCount.value),
    icon: Languages,
    title: '语言关联',
    description: localeItems.value.length
      ? localeItems.value.map(item => item.filename).join(' / ')
      : '当前还没有配置 locale 文件。',
  },
  {
    label: '待处理项',
    value: isScanning.value
      ? '扫描中'
      : numberFormatter.format(issueCount.value),
    icon: CircleAlert,
    title: '问题扫描',
    description: qualityError.value || '来自当前工作区质量扫描结果。',
  },
  {
    label: '服务链路',
    value: workspaceStatus.value,
    icon: RefreshCw,
    title: '服务状态',
    description:
      document.value.error
      || qualityError.value
      || document.value.snapshot?.root
      || '等待加载工作区。',
  },
])
</script>

<template>
  <div class="flex min-h-full items-center justify-center p-4 md:p-8">
    <section class="mx-auto w-full max-w-6xl p-4">
      <div>
        <div class="flex flex-col gap-4 text-center">
          <div>
            <p
              class="text-xs font-medium uppercase tracking-widest text-muted-foreground"
            >
              能力概览
            </p>
            <h2 class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              同一条工作区链路，展示当前真实状态。
            </h2>
            <p
              class="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground"
            >
              TinyI18n 通过同一条本地服务流读取 config、snapshot 和 locale
              文件，让整个工作区的数据状态一眼可见。
            </p>
          </div>
        </div>
        <div
          v-if="document.error || qualityError"
          class="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300"
        >
          {{ document.error || qualityError }}
        </div>

        <div class="mt-10 grid grid-cols-1 items-start gap-3 lg:grid-cols-3">
          <div
            class="flex flex-col overflow-hidden rounded-xl border bg-card lg:col-span-2"
          >
            <div class="flex items-center gap-2.5 border-b px-5 py-3.5">
              <span
                class="flex size-7 items-center justify-center rounded-md bg-muted"
              >
                <Sparkles
                  class="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              </span>
              <span
                class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                核心工作区
              </span>
              <span
                class="ml-auto flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground"
              >
                <span
                  aria-hidden="true"
                  class="size-1.5 rounded-full"
                  :class="{
                    'bg-emerald-500': workspaceStatus === '就绪',
                    'bg-amber-500':
                      workspaceStatus === '扫描中'
                      || workspaceStatus === '加载中',
                    'bg-rose-500': workspaceStatus === '异常',
                    'bg-zinc-400': workspaceStatus === '未初始化',
                  }"
                />
                {{ workspaceStatus }}
              </span>
            </div>

            <div class="flex-1 border-b bg-muted/30 p-5">
              <div class="space-y-4">
                <div>
                  <div
                    class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    工作区输入
                  </div>
                  <div class="mt-1.5 rounded-md border bg-card p-3">
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="item in workspaceInputs"
                        :key="item"
                        class="rounded-md border bg-muted/40 px-2.5 py-1 font-mono text-[11px] text-foreground"
                      >
                        {{ item }}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div
                    class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    解析结果
                  </div>
                  <div class="mt-1.5 divide-y rounded-md border bg-card">
                    <div
                      v-for="row in parseRows"
                      :key="row.badge"
                      class="flex items-center gap-2 px-3 py-2 font-mono text-xs"
                    >
                      <span
                        class="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[9px] font-semibold"
                        :class="row.badgeClass"
                      >
                        {{ row.badge }}
                      </span>
                      <span class="truncate text-foreground">{{
                        row.value
                      }}</span>
                      <span class="ml-auto shrink-0 text-muted-foreground">{{
                        row.meta
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-5">
              <h3 class="text-base font-semibold tracking-tight">
                当前工作区概览
              </h3>
              <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
                已接入 {{ localeCount }} 个语言文件，索引
                {{ numberFormatter.format(messageCount) }} 条消息，默认语言为
                {{ defaultLocaleLabel }}。
              </p>
              <div class="mt-4 grid gap-2 sm:grid-cols-3">
                <div
                  class="rounded-md border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground"
                >
                  {{ localeCount }} 个 locale 文件
                </div>
                <div
                  class="rounded-md border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground"
                >
                  {{ numberFormatter.format(messageCount) }} 条消息
                </div>
                <div
                  class="rounded-md border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground"
                >
                  {{ workspaceStatus }}
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <article
              v-for="card in summaryCards"
              :key="card.label"
              class="flex flex-col rounded-xl border bg-card p-5"
            >
              <div class="flex items-start justify-between gap-3">
                <span
                  class="flex size-9 items-center justify-center rounded-lg bg-muted"
                >
                  <component
                    :is="card.icon"
                    class="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </span>
                <div class="text-right">
                  <div
                    class="text-xl font-semibold tabular-nums text-foreground"
                  >
                    {{ card.value }}
                  </div>
                  <div
                    class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {{ card.label }}
                  </div>
                </div>
              </div>
              <h3 class="mt-4 text-sm font-semibold">
                {{ card.title }}
              </h3>
              <p
                class="mt-1 text-xs leading-relaxed text-muted-foreground break-all"
              >
                {{ card.description }}
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped></style>
