<script setup lang="ts">
import { Trash2, X } from '@lucide/vue'
import { computed } from 'vue'
import { useItemMutations } from '../../composables/commands/useItemMutations'
import { useGroupTree } from '../../composables/group/useGroupTree'
import { useMoveTargetPolicy } from '../../composables/group/useMoveTargetPolicy'
import { useMessageChecked } from '../../composables/message/useMessageChecked'
import { toast } from '../../utils/toast'
import { Button } from '../ui/button'

const { checkedIds, clearChecked: clearAllChecked } = useMessageChecked()
const { tree } = useGroupTree()
const { removeItems, moveItems: moveSelectedItems } = useItemMutations()
const checkedIdList = computed(() => [...checkedIds.value])
const checkedCount = computed(() => checkedIdList.value.length)
const { blockedIds } = useMoveTargetPolicy(checkedIdList)

function clearChecked() {
  clearAllChecked()
}

async function handleDelete() {
  const count = checkedCount.value

  await removeItems(checkedIdList.value)
  toast.success('已删除选中项', {
    description: `共处理 ${count} 条记录`,
  })
}

async function handleMove(target: LocaleTreeGroupNode) {
  await moveSelectedItems(checkedIdList.value, target.id)
  toast.success('已移动选中项', {
    description: `目标：${target.meta.path}`,
  })
}
</script>

<template>
  <div
    class="text-sm pointer-events-auto relative flex w-fit items-center gap-2 rounded-full border bg-background px-3 py-1 shadow-lg"
  >
    <Badge
      variant="secondary"
      class="px-1.5 text-muted-foreground font-normal select-none"
    >
      已选择
      {{ checkedCount }}
      条
    </Badge>
    <Separator
      orientation="vertical"
      class="h-5!"
    />
    <WorkspaceGroupSelectMenu
      label="移动到"
      :tree="tree.roots"
      :blocked-ids="blockedIds"
      @select="handleMove"
    />
    <Button
      size="icon-sm"
      variant="ghost"
      @click="handleDelete"
    >
      <Trash2 />
    </Button>
    <Button
      size="icon-sm"
      variant="ghost"
      @click="clearChecked"
    >
      <X />
    </Button>
  </div>
</template>
