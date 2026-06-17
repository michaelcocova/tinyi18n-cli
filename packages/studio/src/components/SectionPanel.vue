<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <section class="rounded-2xl border bg-card text-card-foreground shadow-sm">
    <header
      class="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h2 class="text-lg font-semibold tracking-tight">{{ title }}</h2>
        <p v-if="description" class="mt-1 text-sm text-muted-foreground">{{ description }}</p>
      </div>
      <slot name="actions" />
    </header>
    <div class="px-6 py-5">
      <slot />
    </div>
  </section>
</template>
