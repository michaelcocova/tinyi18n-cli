<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/tailwind'

export type ConfirmToastVariant = 'default' | 'destructive'

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    confirmVariant?: ConfirmToastVariant
    onConfirm: () => void
    onCancel: () => void
  }>(),
  {
    description: '',
    confirmText: '确定',
    cancelText: '取消',
    confirmVariant: 'default',
  },
)
const visible = ref(false)
onMounted(() => {
  visible.value = true
})
</script>

<template>
  <div
    :class="
      cn(
        'pointer-events-auto relative w-92 max-w-[calc(100vw-2rem)] rounded-xl border bg-background shadow-lg',
      )
    "
  >
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="visible"

          data-slot="overlay"
          class="fixed w-svw h-svh inset-0 bg-background/10 backdrop-blur-sm z-2025"
        />
      </Transition>
    </Teleport>
    <div class="p-4 z-2026">
      <div class="text-sm font-medium text-foreground">
        {{ props.title }}
      </div>
      <div
        v-if="props.description"
        class="mt-1 text-xs text-muted-foreground"
      >
        {{ props.description }}
      </div>
    </div>
    <div class="flex items-center justify-end gap-2 p-4 pt-0">
      <Button
        variant="secondary"
        size="sm"
        class="h-8 px-3 text-xs font-normal"
        @click="props.onCancel"
      >
        {{ props.cancelText }}
      </Button>
      <Button
        :variant="props.confirmVariant"
        size="sm"
        class="h-8 px-3 text-xs font-normal"
        @click="props.onConfirm"
      >
        {{ props.confirmText }}
      </Button>
    </div>
  </div>
</template>
