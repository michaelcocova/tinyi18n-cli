<script setup lang="ts">
import { ref, shallowRef, watchEffect, onMounted } from "vue";
import { createHighlighter } from "shiki";

const props = defineProps<{
  code: string;
}>();

const highlightedCode = ref("");
const highlighter = shallowRef<any>(null);

onMounted(async () => {
  highlighter.value = await createHighlighter({
    themes: ["one-light"],
    langs: ["typescript"],
  });
});

watchEffect(() => {
  if (highlighter.value && props.code) {
    highlightedCode.value = highlighter.value.codeToHtml(props.code, {
      lang: "typescript",
      theme: "one-light",
    });
  } else {
    // Fallback while loading
    highlightedCode.value = `<pre class="font-mono text-sm leading-relaxed text-zinc-300"><code>${props.code}</code></pre>`;
  }
});
</script>

<template>
  <div class="h-svh sticky top-0 flex items-center">
    <div
      class="w-full lg:w-md max-h-auto lg:max-h-[calc(100vh-100px)] overflow-hidden flex flex-col rounded-2xl border bg-muted/50"
    >
      <div class="flex items-center gap-2 border-b bg-background/60 px-4 py-2.5">
        <div class="flex gap-1.5">
          <span class="size-2.5 rounded-full bg-red-500" />
          <span class="size-2.5 rounded-full bg-yellow-500" />
          <span class="size-2.5 rounded-full bg-green-500" />
        </div>
        <span class="ml-2 font-mono text-sm text-muted-foreground/60"> config.ts </span>
      </div>
      <div
        class="flex-1 overflow-y-auto outline-0 px-5 py-4 sm:px-6 font-mono text-xs leading-6"
        v-html="highlightedCode"
      />
    </div>
  </div>
</template>
