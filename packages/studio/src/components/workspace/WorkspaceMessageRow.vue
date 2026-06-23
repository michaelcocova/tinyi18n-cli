<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { LocaleTreeNode } from '../../../../cli/src/core/message.ts'
import {
  CheckSquare,
  ChevronRight,
  FolderTree,
  Languages,
  MinusSquare,
  Square,
} from '@lucide/vue'
import { useLocaleConfig } from '../../composables/core/useLocaleConfig.ts'
import { useTranslations } from '../../composables/message/useTranslations.ts'
import { cn } from '../../utils/tailwind.ts'
import WorkspaceRowActions from './WorkspaceRowActions.vue'

const props = defineProps<{
  item: LocaleTreeNode
  class?: HTMLAttributes['class']
}>()

const { localeConfig } = useLocaleConfig()
const { isExpanded, toggleExpanded, isSelected, select, isChecked, isIndeterminate, toggleChecked } = useTranslations()
const messagePreviewLocale = computed(
  () => localeConfig.value.defaultLocale || 'zh-CN',
)
</script>

<template>
  <div
    :data-id="item.id"
    :data-state="isSelected(item.id) ? 'selected' : undefined"
    :style="{
      'padding-left': `calc(var(--spacing) * 3 * ${item.depth} + 6px)`,
    }"
    :class="
      cn(
        'group/row min-h-8 p-1.5 relative flex text-xs/5 border-l-3 border-transparent items-start gap-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800',
        {
          'border-l-blue-600 rounded-l-none bg-zinc-100':
            isSelected(item.id) || isChecked(item.id),
        },
        props?.class,
      )
    "
    @click="select(item.id)"
  >
    <button
      :class="
        cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full transition-all hover:bg-zinc-200',
          { 'opacity-0': !item.hasChildren },
        )
      "
      @click.stop.prevent="toggleExpanded(item.id)"
    >
      <ChevronRight
        :class="
          cn('size-3.5 transition-transform duration-200', {
            'rotate-90': isExpanded(item.id),
          })
        "
      />
    </button>
    <button
      :class="
        cn(
          'flex size-5 shrink-0 transition-all rounded items-center justify-center hover:bg-zinc-200',
        )
      "
      @click.stop.prevent="toggleChecked(item.id)"
    >
      <CheckSquare
        v-if="isChecked(item.id)"
        class="size-4 text-primary"
      />
      <MinusSquare
        v-else-if="isIndeterminate(item.id)"
        class="size-4 text-primary"
      />
      <Square
        v-else
        class="size-4"
      />
    </button>
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
    <WorkspaceRowActions
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
