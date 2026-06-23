<script setup lang="ts">
import type { SidebarProps } from '../ui/sidebar'
import { GalleryVerticalEnd, Gauge, Languages, Trash2 } from '@lucide/vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar'

defineProps<SidebarProps>()
const route = useRoute()

const navigationItems = [
  { title: '项目概览', to: '/', icon: Gauge },
  { title: '翻译工作台', to: '/translations', icon: Languages },
  { title: '最近删除', to: '/trash', icon: Trash2 },
  // { title: "质量检查", to: "/quality", icon: Sparkles },
  // { title: "重构中心", to: "/refactor", icon: RefreshCcw },
  // { title: "项目配置", to: "/settings", icon: Settings2 },
]
</script>

<template>
  <Sidebar
    variant="sidebar"
    collapsible="icon"
  >
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem class="flex items-center">
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div
              class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
            >
              <GalleryVerticalEnd class="size-4" />
            </div>
            <label class="sr-only"> TinyI18n Studio </label>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem
            v-for="item in navigationItems"
            :key="item.to"
          >
            <SidebarMenuButton
              as-child
              :is-active="route.path === item.to"
            >
              <RouterLink :to="item.to">
                <component :is="item.icon" />
                <span>{{ item.title }}</span>
              </RouterLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</template>
