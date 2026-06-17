<script setup lang="ts">
import { ChevronRight } from "@lucide/vue";
import { computed } from "vue";
import { useGroupFilterExpansion } from "../../composables/group/useGroupFilterExpansion";
import { useGroupMoveExpansion } from "../../composables/group/useGroupMoveExpansion";
import { Button } from "../ui/button";

type WorkspaceGroupSelectMenuExpansionScope = "filter" | "move";

const props = withDefaults(
  defineProps<{
    node: LocaleTreeGroupNode;
    blockedIds: Set<string>;
    expansionScope?: WorkspaceGroupSelectMenuExpansionScope;
  }>(),
  {
    expansionScope: "move",
  },
);

const emit = defineEmits<{
  (event: "select", target: LocaleTreeGroupNode): void;
}>();

const moveExpansion = useGroupMoveExpansion();
const filterExpansion = useGroupFilterExpansion();

const children = computed(() =>
  props.node.children.filter(
    (child) => child.original.type !== "message" && !props.blockedIds.has(child.id),
  ),
);

const expansionState = computed(() =>
  props.expansionScope === "filter" ? filterExpansion : moveExpansion,
);

const expanded = computed(
  () => children.value.length > 0 && expansionState.value.isExpanded(props.node.id),
);

function toggleExpanded() {
  expansionState.value.toggleExpanded(props.node.id);
}

function selectCurrent() {
  emit("select", props.node);
}
</script>

<template>
  <div class="space-y-1">
    <div class="flex items-center gap-1">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        :class="['size-6 rounded-sm', !children.length && 'pointer-events-none opacity-0']"
        @click.stop="toggleExpanded"
      >
        <ChevronRight
          :class="['size-3.5 transition-transform duration-200', expanded && 'rotate-90']"
        />
      </Button>
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
        @click="selectCurrent"
      >
        <span class="truncate">
          {{ node.original.type === "group" ? node.original.title : node.key }}
        </span>
        <span class="ml-auto text-xs text-muted-foreground">{{ node.key }}</span>
      </button>
    </div>

    <div v-if="expanded" class="ml-3 border-l">
      <WorkspaceGroupSelectMenuNode
        v-for="child in children"
        :key="child.id"
        :node="child"
        :blocked-ids="blockedIds"
        :expansion-scope="expansionScope"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>
