<script setup lang="ts">
import type { ClassValue } from "clsx";

withDefaults(
  defineProps<{
    legend?: string;
    headerClass?: ClassValue;
  }>(),
  {},
);
</script>

<template>
  <div class="flex flex-col gap-2">
    <header class="w-full flex items-center">
      <span class="" :class="cn('text-xs text-slate-500', headerClass)">
        <slot name="legend">
          {{ legend }}
        </slot>
      </span>
      <div class="ml-auto px-3 flex items-center gap-3">
        <slot name="extra" />
      </div>
    </header>
    <slot />
  </div>
</template>
