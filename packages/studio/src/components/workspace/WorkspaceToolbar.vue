<script setup lang="ts">
import type { TinyI18nPathFilterMode } from '../../composables/path-query'
import type { SearchBoxModelValue, SearchBoxSchema } from '@/components/ui/search-box'
import {
  ChevronDown,
  FolderPlus,
  Funnel,
  Plus,
} from '@lucide/vue'
import { SearchBox } from '@/components/ui/search-box'
import { useGroupTree } from '../../composables/group/useGroupTree'
import { useTranslations } from '../../composables/message/useTranslations.ts'

const { tree: groupTree } = useGroupTree()
const {
  filterState,
  createGroup,
  createMessage,
  select,
  availableLocales,
} = useTranslations()

const pathFilterDraftMode = ref<TinyI18nPathFilterMode>('include')

const searchBoxItems = computed<SearchBoxSchema[]>(() => [
  {
    field: 'query',
    label: '关键词',
    type: 'input',
    placeholder: '搜索 key / 文本 / 路径',
  },
  {
    field: 'pathFilter',
    label: '路径过滤',
    type: 'custom',
    repeatable: true,
    slotName: 'pathFilter',
  },
  {
    field: 'localeScope',
    label: '语言范围',
    type: 'enum',
    mode: 'multi',
    options: availableLocales.value.map(code => ({
      label: code,
      value: code,
    })),
  },
  {
    field: 'issues',
    label: '问题类型',
    type: 'enum',
    mode: 'multi',
    options: [
      {
        label: '缺失翻译',
        description: '任意语言翻译缺失',
        value: 'missing_translation',
      },
      ...availableLocales.value.map(code => ({ label: `${code} 缺失翻译`, value: `$missing_translation:${code}` })),
      {
        label: '缺失 Key',
        value: 'missing_key',
      },
      {
        label: '重复 Key',
        value: 'duplicate_key',
      },
      {
        label: '重复翻译内容',
        value: 'duplicate_translation',
      },
      {
        label: '未使用 Key',
        value: 'unused_key',
      },
      {
        label: '占位符不一致',
        value: 'placeholder_mismatch',
      },
    ],
  },
])

const searchBoxFilterState = computed<SearchBoxModelValue>({
  get() {
    return filterState.value
  },
  set(next) {
    filterState.value = {
      query: String(next?.query ?? ''),
      pathFilter: Array.isArray(next?.pathFilter) ? next.pathFilter.map(String) : [],
      localeScope: Array.isArray(next?.localeScope) ? next.localeScope.map(String) : [],
      issues: Array.isArray(next?.issues) ? next.issues.map(String) : [],
    }
  },
})

async function handleAddGroup() {
  const nextItem = await createGroup()
  if (nextItem) {
    select(nextItem.id)
  }
}

async function handleAddMessage() {
  const nextItem = await createMessage()
  if (nextItem) {
    select(nextItem.id)
  }
}
</script>

<template>
  <div class="mb-0 flex flex-wrap items-center gap-2 border-b px-4 py-1.5">
    <WorkspaceTreeNavigator />
    <Funnel class="size-3.5" />

    <SearchBox
      v-model="searchBoxFilterState"
      class="flex-1"
      :items="searchBoxItems"
    >
      <!-- 路径过滤：custom slot -->
      <template #pathFilter="{ confirm, close }">
        <div class="space-y-2">
          <div class="text-xs text-muted-foreground">
            选择一个分组路径作为过滤条件
          </div>
          <div class="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="outline"
                  size="sm"
                  class="h-7 px-2 text-xs font-normal"
                >
                  {{ pathFilterDraftMode === 'include' ? '包含' : '排除' }}
                  <ChevronDown class="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem @click="pathFilterDraftMode = 'include'">
                  包含
                </DropdownMenuItem>
                <DropdownMenuItem @click="pathFilterDraftMode = 'exclude'">
                  排除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <WorkspaceGroupSelectMenu
              label="请选择"
              :tree="groupTree.roots"
              expansion-scope="filter"
              @select="
                (group) => {
                  const mode: TinyI18nPathFilterMode = pathFilterDraftMode
                  const path = group.meta.path
                  confirm(`${mode}:${path}`)
                  close()
                }
              "
            >
              <template #default="{ disabled }">
                <Button
                  variant="outline"
                  size="sm"
                  class="h-7 px-2 text-xs font-normal"
                  :disabled="disabled"
                >
                  选择分组
                  <ChevronDown class="ml-1 size-3" />
                </Button>
              </template>
            </WorkspaceGroupSelectMenu>
          </div>
        </div>
      </template>
    </SearchBox>
    <div class="flex-1" />
    <div class="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        class="h-8 px-2 text-xs font-normal"
        @click="handleAddGroup"
      >
        <FolderPlus class="size-3" />
        添加分组
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="h-8 px-2 text-xs font-normal"
        @click="handleAddMessage"
      >
        <Plus class="size-3" />
        添加消息
      </Button>
    </div>
  </div>
</template>
