<script setup lang="ts">
import TrashMessageList from '../components/workspace/TrashMessageList.vue'
import TrashToolbar from '../components/workspace/TrashToolbar.vue'
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden text-xs">
    <TrashToolbar />

    <div class="flex-1 relative h-full">
      <TrashMessageList class="p-3" />
    </div>
  </div>
</template>
