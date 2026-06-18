<script setup lang="ts">
import type { VirtualizerHandle } from 'virtua/vue'
import { ChevronDown, ChevronRight, FileText, FolderTree } from '@lucide/vue'
import { Virtualizer } from 'virtua/vue'
import { computed, nextTick, ref, watch } from 'vue'
import { cn } from '../utils/tailwind'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface LocaleEntryLike {
  key: string
  namespace: string
  values: Record<string, string>
  missingLanguages: string[]
}

interface TreeNode {
  id: string
  label: string
  depth: number
  pathSegments: string[]
  children: TreeNode[]
  entry?: LocaleEntryLike
}

interface VisibleRow {
  node: TreeNode
  isLeaf: boolean
  leafCount: number
}

const props = defineProps<{
  entries: LocaleEntryLike[]
  languages: string[]
  pending: boolean
}>()

const emit = defineEmits<{
  save: [entries: LocaleEntryLike[]]
}>()

const entriesState = ref<LocaleEntryLike[]>([])
const expandedState = ref<Record<string, boolean>>({})
const selectedNodeId = ref<string | null>(null)
const contentContainer = ref<HTMLElement | null>(null)
const contentVirtualizer = ref<VirtualizerHandle | null>(null)

watch(
  () => props.entries,
  (entries) => {
    entriesState.value = entries.map(entry => ({
      key: entry.key,
      namespace: entry.namespace,
      values: { ...entry.values },
      missingLanguages: [...entry.missingLanguages],
    }))

    const nextExpandedState: Record<string, boolean> = {}
    for (const entry of entriesState.value) {
      const segments = entry.key.split('.')
      for (let index = 0; index < segments.length - 1; index += 1) {
        const id = segments.slice(0, index + 1).join('.')
        nextExpandedState[id] = expandedState.value[id] ?? true
      }
    }

    expandedState.value = nextExpandedState

    if (
      selectedNodeId.value
      && !entriesState.value.some(
        entry =>
          entry.key === selectedNodeId.value
          || entry.key.startsWith(`${selectedNodeId.value}.`),
      )
    ) {
      selectedNodeId.value = null
    }
  },
  { immediate: true },
)

const treeNodes = computed<TreeNode[]>(() => buildTree(entriesState.value))

const visibleRows = computed<VisibleRow[]>(() =>
  flattenVisibleRows(treeNodes.value, expandedState.value),
)
const navigationRows = computed<VisibleRow[]>(() =>
  visibleRows.value.filter(row => !row.isLeaf),
)

const gridTemplateColumns = computed(() => {
  return `minmax(320px, 1.6fr) repeat(${props.languages.length}, minmax(180px, 1fr))`
})

function buildTree(entries: LocaleEntryLike[]): TreeNode[] {
  const roots: TreeNode[] = []

  for (const entry of [...entries].sort((left, right) =>
    left.key.localeCompare(right.key),
  )) {
    const segments = entry.key.split('.')
    insertNode(roots, segments, entry, 0)
  }

  return normalizeNodes(roots)
}

function insertNode(
  nodes: TreeNode[],
  segments: string[],
  entry: LocaleEntryLike,
  depth: number,
) {
  const segment = segments[depth]
  if (!segment) {
    return
  }

  let node = nodes.find(item => item.label === segment)

  if (!node) {
    node = {
      id: segments.slice(0, depth + 1).join('.'),
      label: segment,
      depth,
      pathSegments: segments.slice(0, depth + 1),
      children: [],
    }
    nodes.push(node)
  }

  if (depth === segments.length - 1) {
    node.entry = entry
    return
  }

  insertNode(node.children, segments, entry, depth + 1)
}

function normalizeNodes(nodes: TreeNode[]): TreeNode[] {
  return [...nodes]
    .sort((left, right) => {
      if (left.entry && !right.entry) {
        return 1
      }

      if (!left.entry && right.entry) {
        return -1
      }

      return left.label.localeCompare(right.label)
    })
    .map(node => ({
      ...node,
      children: normalizeNodes(node.children),
    }))
}

function flattenVisibleRows(
  nodes: TreeNode[],
  expanded: Record<string, boolean>,
): VisibleRow[] {
  const result: VisibleRow[] = []

  for (const node of nodes) {
    const isLeaf = node.children.length === 0
    result.push({
      node,
      isLeaf,
      leafCount: countLeafNodes(node),
    })

    if (!isLeaf && expanded[node.id]) {
      result.push(...flattenVisibleRows(node.children, expanded))
    }
  }

  return result
}

function countLeafNodes(node: TreeNode): number {
  if (node.children.length === 0) {
    return 1
  }

  return node.children.reduce((sum, child) => sum + countLeafNodes(child), 0)
}

function isTerminalGroup(node: TreeNode): boolean {
  return (
    node.children.length > 0
    && node.children.every(child => child.children.length === 0)
  )
}

function toggleNode(nodeId: string) {
  expandedState.value = {
    ...expandedState.value,
    [nodeId]: !expandedState.value[nodeId],
  }
}

function expandAll() {
  const nextExpandedState: Record<string, boolean> = {}

  function visit(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (node.children.length > 0) {
        nextExpandedState[node.id] = true
        visit(node.children)
      }
    }
  }

  visit(treeNodes.value)
  expandedState.value = nextExpandedState
}

function collapseAll() {
  expandedState.value = {}
}

function updateValue(
  entry: LocaleEntryLike,
  language: string,
  nextValue: string | number,
) {
  entry.values[language] = String(nextValue ?? '')
}

async function selectNode(nodeId: string | null) {
  selectedNodeId.value = nodeId

  await nextTick()

  if (!nodeId) {
    contentVirtualizer.value?.scrollTo(0)
    return
  }

  const targetIndex = visibleRows.value.findIndex(
    row => row.node.id === nodeId,
  )
  if (targetIndex >= 0) {
    contentVirtualizer.value?.scrollToIndex(targetIndex)
  }
}

function save() {
  emit(
    'save',
    entriesState.value.map(entry => ({
      key: entry.key,
      namespace: entry.namespace,
      values: { ...entry.values },
      missingLanguages: [...entry.missingLanguages],
    })),
  )
}
</script>

<template>
  <div class="space-y-4">
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="max-w-2xl text-sm text-muted-foreground">
        树形编辑器会按照路径展示翻译节点，只有叶子节点可以直接编辑。
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          @click="expandAll"
        >
          全部展开
        </Button>
        <Button
          variant="outline"
          @click="collapseAll"
        >
          全部收起
        </Button>
        <Button
          :disabled="pending"
          @click="save"
        >
          {{ pending ? "保存中..." : "保存全部修改" }}
        </Button>
      </div>
    </div>

    {{ navigationRows }}
    <div class="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside class="overflow-hidden rounded-xl border bg-card">
        <div class="border-b px-4 py-3">
          <p class="text-sm font-medium">
            目录导航
          </p>
          <p class="mt-1 text-xs text-muted-foreground">
            点击节点快速定位右侧对应位置
          </p>
        </div>
        <div class="max-h-[620px] overflow-auto p-2">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            :class="!selectedNodeId ? 'bg-accent text-accent-foreground' : ''"
            @click="selectNode(null)"
          >
            <span>全部</span>
            <span class="text-xs text-muted-foreground">{{ entriesState.length }} 项</span>
          </button>

          <div class="mt-2 space-y-1">
            <div
              v-for="row in navigationRows"
              :key="`nav:${row.node.id}`"
            >
              <div
                class="flex items-center gap-1 rounded-md px-2 py-1"
                :class="
                  selectedNodeId === row.node.id
                    ? 'bg-accent text-accent-foreground'
                    : ''
                "
              >
                <button
                  v-if="!isTerminalGroup(row.node)"
                  type="button"
                  class="inline-flex size-7 items-center justify-center rounded-sm hover:bg-muted"
                  @click.stop="toggleNode(row.node.id)"
                >
                  <ChevronDown
                    v-if="expandedState[row.node.id]"
                    class="size-4 shrink-0 text-muted-foreground"
                  />
                  <ChevronRight
                    v-else
                    class="size-4 shrink-0 text-muted-foreground"
                  />
                </button>
                <span
                  v-else
                  class="inline-flex size-7 items-center justify-center"
                >
                  <FolderTree class="size-3.5 shrink-0 text-muted-foreground" />
                </span>

                <button
                  type="button"
                  class="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left hover:bg-muted"
                  :style="{ paddingLeft: `${row.node.depth * 14}px` }"
                  @click="selectNode(row.node.id)"
                >
                  <span class="truncate text-sm">{{ row.node.label }}</span>
                  <span class="shrink-0 text-[11px] text-muted-foreground">
                    {{ row.isLeaf ? "叶子节点" : `${row.leafCount} 项` }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div class="overflow-hidden rounded-xl border bg-card">
        <div
          class="grid border-b bg-muted/40 text-sm font-medium text-muted-foreground"
          :style="{ gridTemplateColumns }"
        >
          <div class="px-4 py-3">
            键名
          </div>
          <div
            v-for="language in languages"
            :key="language"
            class="border-l px-4 py-3"
          >
            {{ language }}
          </div>
        </div>

        <div
          ref="contentContainer"
          class="max-h-[620px] overflow-auto [overflow-anchor:none]"
        >
          <Virtualizer
            ref="contentVirtualizer"
            v-slot="{ item: row }"
            :data="visibleRows"
            :scroll-ref="contentContainer ?? undefined"
            :buffer-size="8"
          >
            <div
              :key="row.node.id"
              class="grid border-b last:border-b-0"
              :data-node-id="row.node.id"
              :style="{ gridTemplateColumns }"
            >
              <div class="flex min-h-12 items-center px-3 py-2">
                <button
                  v-if="!row.isLeaf"
                  type="button"
                  class="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-muted"
                  :style="{ paddingLeft: `${row.node.depth * 20 + 8}px` }"
                  @click="toggleNode(row.node.id)"
                >
                  <ChevronDown
                    v-if="expandedState[row.node.id]"
                    class="size-4 shrink-0 text-muted-foreground"
                  />
                  <ChevronRight
                    v-else
                    class="size-4 shrink-0 text-muted-foreground"
                  />
                  <FolderTree class="size-4 shrink-0 text-muted-foreground" />
                  <span class="font-medium">{{ row.node.label }}</span>
                  <span class="text-xs text-muted-foreground">{{ row.leafCount }} 项</span>
                </button>

                <div
                  v-else
                  class="flex w-full items-center gap-2 rounded-md px-2 py-2"
                  :style="{ paddingLeft: `${row.node.depth * 20 + 32}px` }"
                >
                  <FileText class="size-4 shrink-0 text-muted-foreground" />
                  <span class="font-mono text-sm">{{ row.node.label }}</span>
                </div>
              </div>

              <template v-if="row.isLeaf">
                <div
                  v-for="language in languages"
                  :key="`${row.node.id}:${language}`"
                  class="border-l px-3 py-2"
                >
                  <Input
                    v-if="row.node.entry"
                    :model-value="row.node.entry!.values[language] ?? ''"
                    :class="
                      cn(
                        !(row.node.entry!.values[language] ?? '').trim()
                          && 'border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30',
                      )
                    "
                    @update:model-value="
                      updateValue(row.node.entry!, language, $event)
                    "
                  />
                </div>
              </template>
            </div>
          </Virtualizer>
        </div>
      </div>
    </div>
  </div>
</template>
