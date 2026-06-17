<script setup lang="ts">
import { VList } from "virtua/vue";
import type { VListHandle } from "virtua/vue";
import WorkspaceMessageRow from "./WorkspaceMessageRow.vue";
import type { HTMLAttributes } from "vue";
import { ArrowUpToLine, FolderPlus, Plus } from "@lucide/vue";
import { useMessageExpansion } from "../../composables/message/useMessageExpansion.ts";
import { useMessageSearchMatches } from "../../composables/message/useMessageSearchMatches.ts";
import { useMessageTree } from "../../composables/message/useMessageTree.ts";
import { projectVisibleRows } from "../../composables/tree/projectVisibleRows.ts";
import { useItemMutations } from "../../composables/commands/useItemMutations.ts";
import { useMessageSelection } from "../../composables/message/useMessageSelection.ts";
import { Button } from "../ui/button";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
const { tree } = useMessageTree();
const { expandedIds } = useMessageExpansion();
const { matchedIds } = useMessageSearchMatches();
const { createGroup, createMessage } = useItemMutations();
const { select } = useMessageSelection();
const listRef = ref<VListHandle>();
const rows = computed(() =>
  projectVisibleRows(tree.value, expandedIds.value, {
    matchedIds: matchedIds.value,
  }),
);

function scrollToMessage(id: string) {
  const index = rows.value.findIndex((item) => item.id === id);

  if (index < 0) {
    return;
  }

  listRef.value?.scrollToIndex(index, { align: "start" });
}

function handleScrollToMessage(event: Event) {
  const id = (event as CustomEvent<{ id?: string }>).detail?.id;

  if (!id) {
    return;
  }

  scrollToMessage(id);
}

async function handleAddGroup() {
  const nextItem = await createGroup();
  if (nextItem) {
    select(nextItem.id);
  }
}

async function handleAddMessage() {
  const nextItem = await createMessage();
  if (nextItem) {
    select(nextItem.id);
  }
}

onMounted(() => {
  window.addEventListener("workspace:scroll-to-message", handleScrollToMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener("workspace:scroll-to-message", handleScrollToMessage);
});
</script>

<template>
  <div class="relative h-full overflow-hidden">
    <div
      v-if="rows.length === 0"
      class="flex h-full flex-col items-center justify-center text-muted-foreground gap-4"
    >
      <div class="text-sm">暂无数据</div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="handleAddGroup">
          <FolderPlus class="mr-2 size-4" />
          添加分组
        </Button>
        <Button variant="outline" size="sm" @click="handleAddMessage">
          <Plus class="mr-2 size-4" />
          添加消息
        </Button>
      </div>
    </div>
    <VList
      v-else
      ref="listRef"
      :data="rows"
      :class="cn('h-full', props?.class)"
      :item-size="32"
      #default="{ item }"
    >
      <WorkspaceMessageRow :key="item.id" :item="item" />
    </VList>
    <!-- <Button
      v-if="rows.length > 0"
      class="absolute bottom-4 right-4 rounded-full shadow-md"
      variant="secondary"
      size="icon-sm"
      @click="listRef?.scrollToIndex(0, { align: 'start' })"
    >
      <ArrowUpToLine class="size-4" />
    </Button> -->
  </div>
</template>
