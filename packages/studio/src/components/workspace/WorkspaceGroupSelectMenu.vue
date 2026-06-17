<script setup lang="ts">
import { FolderInput } from "@lucide/vue";
import { computed, ref } from "vue";
import WorkspaceGroupSelectMenuNode from "./WorkspaceGroupSelectMenuNode.vue";
import { Button } from "../ui/button/index.ts";

const props = defineProps<{
  label?: string;
  tree: LocaleTreeGroupNode[];
  blockedIds?: string[];
  expansionScope?: "filter" | "move";
}>();

const emit = defineEmits<{
  (event: "select", target: LocaleTreeGroupNode): void;
  (event: "openChange", open: boolean): void;
}>();
defineSlots<{
  default?: (props: { disabled: boolean }) => any;
}>();

const open = ref(false);
const blockedIdSet = computed(() => new Set(props.blockedIds ?? []));

function isGroupTarget(node: LocaleTreeGroupNode) {
  return node.original.type !== "message" && !blockedIdSet.value.has(node.id);
}

function getVisibleRoots() {
  return props.tree.filter((node) => isGroupTarget(node));
}

function handleOpenChange(nextOpen: boolean) {
  open.value = nextOpen;
  emit("openChange", nextOpen);
}

function handleSelect(target: LocaleTreeGroupNode) {
  emit("select", target);
  handleOpenChange(false);
}
</script>

<template>
  <DropdownMenu :open="open" @update:open="handleOpenChange">
    <DropdownMenuTrigger as-child>
      <slot :disabled="getVisibleRoots().length === 0">
        <Button size="icon-sm" variant="ghost" :disabled="getVisibleRoots().length === 0">
          <FolderInput />
        </Button>
      </slot>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="center" class="w-56">
      <DropdownMenuLabel>{{ label ?? "请选择" }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <div class="max-h-80 overflow-y-auto px-1 pb-1">
        <WorkspaceGroupSelectMenuNode
          v-for="node in getVisibleRoots()"
          :key="node.id"
          :node="node"
          :blocked-ids="blockedIdSet"
          :expansion-scope="props.expansionScope ?? 'move'"
          @select="handleSelect"
        />
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
