<script setup lang="ts">
defineProps<{
  label: string;
  value: number | string;
  tone?: "default" | "positive" | "warning";
  helper?: string;
}>();
</script>

<template>
  <article
    class="rounded-xl border bg-card p-5 text-card-foreground shadow-sm"
    :class="{
      'border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20':
        (tone ?? 'default') === 'warning',
      'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20':
        (tone ?? 'default') === 'positive',
    }"
  >
    <p class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{{ label }}</p>
    <strong class="mt-3 block text-3xl font-semibold tracking-tight">{{ value }}</strong>
    <p v-if="helper" class="mt-2 text-sm text-muted-foreground">{{ helper }}</p>
  </article>
</template>
