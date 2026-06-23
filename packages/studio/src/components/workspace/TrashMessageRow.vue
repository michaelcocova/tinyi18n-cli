<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { LocaleTreeNode } from '../../../../cli/src/core/message.ts'
import {
  ChevronRight,
  FolderTree,
  Languages,
} from '@lucide/vue'
import { computed } from 'vue'
import { useLocaleConfig } from '../../composables/core/useLocaleConfig.ts'
import { cn } from '../../utils/tailwind.ts'
import TrashRowActions from './TrashRowActions.vue'

const props = defineProps<{
  item: LocaleTreeNode
  class?: HTMLAttributes['class']
}>()

const { localeConfig } = useLocaleConfig()
const messagePreviewLocale = computed(
  () => localeConfig.value?.defaultLocale || 'zh-CN',
)
</script>

<template>
  <div
    :data-id="item.id"
    :style="{
      'padding-left': `calc(var(--spacing) * 3 * ${item.depth} + 6px)`,
    }"
    :class="
      cn(
        'group/row min-h-8 p-1.5 relative flex text-xs/5 border-l-3 border-transparent items-start gap-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800',
        props?.class,
      )
    "
  >
    <div
      :class="
        cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full transition-all',
          { 'opacity-0': !item.hasChildren },
        )
      "
    >
      <ChevronRight
        :class="
          cn('size-3.5 transition-transform duration-200 rotate-90')
        "
      />
    </div>
    <label
      v-if="item.original.type === 'message'"
      :class="{
        'text-muted-foreground':
          !item.original.translations[messagePreviewLocale],
      }"
    >
      {{ item.original.translations[messagePreviewLocale] || "未翻译" }}
    </label>
    <label
      v-else
      :class="{
        'text-muted-foreground': !item.original?.title && !item.original?.key,
      }"
    >
      <template v-if="!item.original?.title && !item.original?.key">
        未命名
      </template>
      <template v-else-if="!item.original?.title">
        {{ item.original.key }}
      </template>
      <template v-else>
        <span>{{ item.original.title }}</span>
        <small
          v-if="!item.original?.key"
          class="text-destructive ml-1"
        >
          &lt;无 Key&gt;
        </small>
        <small
          v-else
          class="text-muted-foreground ml-1 font-mono"
        >
          {{ item.original.key }}
        </small>
      </template>
    </label>
    <TrashRowActions
      class="ml-auto opacity-0 pointer-events-none group-hover/row:opacity-100 group-hover/row:pointer-events-auto"
      :item="item"
      @click.stop.prevent
    />
    <FolderTree
      v-if="item.original.type === 'group'"
      class="text-slate-400 size-3.5 mt-1"
    />
    <Languages
      v-else
      class="text-slate-400 size-3.5 mt-1"
    />
  </div>
</template>
