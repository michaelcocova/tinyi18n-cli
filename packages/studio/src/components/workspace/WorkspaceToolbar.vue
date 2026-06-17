<script setup lang="ts">
import { ChevronDown, FolderPlus, Funnel, ListFilterPlus, Plus, Search, X } from "@lucide/vue";
import type { TinyI18nPathFilterMode } from "../../composables/path-query";
import { useGroupTree } from "../../composables/group/useGroupTree";
import { usePathFilters } from "../../composables/group/usePathFilters";
import { useMessageSearchQuery } from "../../composables/message/useMessageSearchQuery";
import { useItemMutations } from "../../composables/commands/useItemMutations";
import { useMessageSelection } from "../../composables/message/useMessageSelection";

interface PathFilterDraft {
  id: string;
  mode: TinyI18nPathFilterMode;
}

const { tree } = useGroupTree();
const { filters, addFromGroup, removeFilter } = usePathFilters();
const { query, setQuery, clearQuery } = useMessageSearchQuery();
const { createGroup, createMessage } = useItemMutations();
const { select } = useMessageSelection();
const drafts = ref<PathFilterDraft[]>([]);
const pathFilterModeOptions: Array<{
  value: TinyI18nPathFilterMode;
  label: string;
}> = [
  { value: "include", label: "包含" },
  { value: "exclude", label: "排除" },
];

function createDraft() {
  drafts.value = [
    ...drafts.value,
    {
      id: crypto.randomUUID(),
      mode: "include",
    },
  ];
}

function updateDraftMode(id: string, mode: TinyI18nPathFilterMode) {
  drafts.value = drafts.value.map((draft) => (draft.id === id ? { ...draft, mode } : draft));
}

function selectDraftGroup(draft: PathFilterDraft, group: LocaleTreeGroupNode) {
  addFromGroup(draft.mode, group.id);
  drafts.value = drafts.value.filter((item) => item.id !== draft.id);
}

function formatPathFilterQuery(query: string) {
  return query.replace(/^\$\./, "");
}
function removeDraft(id: string) {
  drafts.value = drafts.value.filter((draft) => draft.id !== id);
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
</script>

<template>
  <div class="mb-0 flex flex-wrap items-center gap-2 border-b px-4 py-1.5">
    <WorkspaceTreeNavigator />
    <Funnel class="size-3.5" />
    <Badge
      v-for="filter in filters"
      :key="filter.id"
      variant="outline"
      class="border-dashed h-7 gap-1 rounded-full px-1"
    >
      <span>{{ filter.mode === "include" ? "" : "!" }}</span>
      <span class="font-mono font-normal">{{ formatPathFilterQuery(filter.query) }}</span>
      <button
        class="rounded-full p-0.5 hover:bg-black/10"
        type="button"
        @click="removeFilter(filter.id)"
      >
        <X class="size-3" />
      </button>
    </Badge>
    <Badge
      v-for="draft in drafts"
      :key="draft.id"
      variant="outline"
      class="h-7 gap-1 rounded-0! px-1"
    >
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" class="text-xs font-normal h-5 p-0 rounded-0.5">
            {{ draft.mode === "include" ? "包含" : "排除" }}
            <ChevronDown class="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="[--radius:0.95rem]">
          <DropdownMenuItem
            v-for="option in pathFilterModeOptions"
            :key="option.value"
            @click="updateDraftMode(draft.id, option.value)"
          >
            {{ option.label }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <WorkspaceGroupSelectMenu
        label="请选择"
        :tree="tree.roots"
        expansion-scope="filter"
        @select="selectDraftGroup(draft, $event)"
      >
        <template #default="{ disabled }">
          <Button
            variant="ghost"
            class="text-xs font-normal h-5 p-0 rounded-0.5"
            :disabled="disabled"
          >
            选择
            <ChevronDown class="size-3" />
          </Button>
        </template>
      </WorkspaceGroupSelectMenu>
      <button
        class="rounded-full p-0.5 hover:bg-black/10"
        type="button"
        @click="removeDraft(draft.id)"
      >
        <X class="size-3" />
      </button>
    </Badge>

    <Button
      variant="ghost"
      size="icon-sm"
      class="size-6"
      title="添加过滤条件"
      aria-label="添加过滤条件"
      @click="createDraft"
    >
      <ListFilterPlus />
    </Button>
    <div class="flex-1" />
    <div class="flex items-center gap-1">
      <Button variant="outline" size="sm" class="h-8 px-2 text-xs font-normal" @click="handleAddGroup">
        <FolderPlus class="size-3" />
        添加分组
      </Button>
      <Button variant="outline" size="sm" class="h-8 px-2 text-xs font-normal" @click="handleAddMessage">
        <Plus class="size-3" />
        添加消息
      </Button>
    </div>

    <InputGroup class="h-8 w-64">
      <InputGroupInput
        :model-value="query"
        placeholder="搜索 key / 标题 / 翻译"
        @update:model-value="setQuery(String($event))"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton v-if="!query" aria-label="搜索" title="搜索" size="icon-xs">
          <Search />
        </InputGroupButton>
        <Button
          v-else
          aria-label="清空搜索"
          title="清空搜索"
          size="icon-sm"
          variant="ghost"
          @click="clearQuery"
        >
          <X />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  </div>
</template>
