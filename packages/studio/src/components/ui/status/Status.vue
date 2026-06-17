<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { StatusVariants } from "./index";
import { cn } from "../../../utils/tailwind";
import { statusVariants } from "./index";

defineProps<{
  variant?: StatusVariants["variant"];
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <span :class="cn('inline-flex items-center gap-1.5 text-sm text-muted-foreground', $props.class)">
    <span :class="statusVariants({ variant })" />

    <slot />
  </span>
</template>
