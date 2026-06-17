<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { Toaster } from "vue-sonner";
import "vue-sonner/style.css";
import { useTinyI18nDocument } from "./composables/core/useTinyI18nDocument";
import SetupPage from "./views/setup/SetupPage.vue";

const route = useRoute();
const { document, load } = useTinyI18nDocument();
const currentPageTitle = computed(() => String(route.meta.title ?? "TinyI18n Studio"));

function refreshWorkspaceData() {
  void load(true);
}

onMounted(() => {
  void load();
});
</script>

<template>
  <Toaster :duration="2000" rich-colors position="top-center" />

  <!-- Loading State -->
  <div v-if="!document.hasLoaded" class="flex h-screen w-full items-center justify-center bg-white">
    <div class="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900"></div>
  </div>

  <!-- 拦截未初始化状态：如果没有 config.ts，或者没有对应的 data.json 数据文件，就判定为未配置好，强制进入 Init 表单页 -->
  <SetupPage v-else-if="document.snapshot && !document.snapshot.initialized" />

  <!-- Error State (Other than not initialized) -->
  <div
    v-else-if="document.error"
    class="flex h-screen w-full items-center justify-center bg-white p-4"
  >
    <div class="max-w-md text-center">
      <h2 class="text-lg font-semibold text-rose-600">无法加载工作区</h2>
      <p class="mt-2 text-sm text-zinc-500">
        {{ document.error || document.snapshot?.error || "未知错误" }}
      </p>
      <Button class="mt-4" @click="refreshWorkspaceData">重试</Button>
    </div>
  </div>

  <!-- Main App -->
  <SidebarProvider v-else :default-open="false" class="h-svh overflow-hidden">
    <AppSidebar />
    <SidebarInset class="h-full overflow-hidden flex flex-col m-0 divide-y">
      <AppHeader :current-page-title="currentPageTitle" @refresh="refreshWorkspaceData" />
      <template v-if="route?.meta?.scroll">
        <ScrollArea class="flex-1 overflow-hidden [&>div]:p-4">
          <RouterView />
        </ScrollArea>
      </template>
      <div class="flex-1 overflow-hidden" v-else>
        <RouterView />
      </div>
      <AppFooter />
    </SidebarInset>
  </SidebarProvider>
</template>
