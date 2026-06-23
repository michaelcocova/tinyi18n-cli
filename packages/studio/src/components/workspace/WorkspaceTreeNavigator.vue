<script setup lang="ts">
import { ChevronRight, LocateFixed } from '@lucide/vue'
import { get } from 'lodash-es'
import { useGroupNavigatorExpansion } from '../../composables/group/useGroupNavigatorExpansion'
import { useGroupTree } from '../../composables/group/useGroupTree'
import { useTranslations } from '../../composables/message/useTranslations'
import { projectVisibleRows } from '../../composables/tree/projectVisibleRows'

const { tree } = useGroupTree()
const { expandedIds, toggleExpanded, isExpanded }
  = useGroupNavigatorExpansion()
const { matchedIds } = useTranslations()
const open = ref(false)
const groups = computed(() =>
  projectVisibleRows(tree.value, expandedIds.value, {
    matchedIds: matchedIds.value,
  }),
)

function scrollToNode(id: string) {
  window.dispatchEvent(
    new CustomEvent('workspace:scroll-to-message', { detail: { id } }),
  )
  open.value = false
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="ghost"
        size="icon-sm"
        class="size-6 data-[state=open]:bg-accent"
      >
        <LocateFixed />
      </Button>
    </PopoverTrigger>

    <PopoverContent
      class="text-sm min-w-50 p-1 overflow-y-auto"
      align="start"
      side="bottom"
    >
      <div
        v-for="item in groups"
        :key="item.id"
        :style="{ 'margin-left': `calc(var(--spacing) * 3 * ${item.depth})` }"
        :data-id="item.id"
        :class="
          cn(
            'cursor-pointer min-h-7 px-1 flex flex-nowrap items-center gap-1 rounded relative dark:hover:bg-zinc-800 hover:bg-zinc-100',
          )
        "
        @click="scrollToNode(item.id)"
      >
        <button
          :class="
            cn(
              'ml-1 transition-all rounded-full size-5 flex items-center justify-center hover:bg-zinc-200',
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
        <label class="inline-flex flex-nowrap">
          {{ get(item, ["original", "title"]) }}
        </label>
        <span
          v-if="item.original.key"
          class="text-slate-400"
        >
          {{ get(item, ["original", "key"]) }}
        </span>
      </div>
    </PopoverContent>
  </Popover>
</template>
