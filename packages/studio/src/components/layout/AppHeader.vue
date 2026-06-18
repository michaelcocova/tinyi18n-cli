<script setup lang="ts">
import { ArrowBigDownDash, RefreshCcw } from '@lucide/vue'
import { useProjectFileSync } from '../../composables/commands/useProjectFileSync'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb'

defineProps<{
  currentPageTitle: string
}>()

defineEmits<{
  refresh: []
}>()

const { isSyncing, sync } = useProjectFileSync()
</script>

<template>
  <header class="flex h-10 shrink-0 items-center gap-2 px-4">
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem class="hidden md:block">
          <BreadcrumbLink href="#">
            TinyI18n Studio
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator class="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{{ currentPageTitle }}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
    <div class="ml-auto" />
    <!-- 刷新 -->
    <Button
      variant="ghost"
      size="icon-sm"
      @click="$emit('refresh')"
    >
      <RefreshCcw />
    </Button>
    <!-- 生成到项目文件 -->
    <Button
      variant="ghost"
      size="icon-sm"
      :disabled="isSyncing"
      :title="isSyncing ? '正在生成项目文件' : '生成到项目文件'"
      @click="sync"
    >
      <ArrowBigDownDash />
    </Button>
  </header>
</template>
