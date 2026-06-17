<script setup lang="ts">
import { markRaw, onBeforeUnmount, onMounted, watch } from "vue";
import MessagesActionsBar from "../components/workspace/MessagesActionsBar.vue";
import { toast } from "../utils/toast.ts";
import { useTinyI18nDocument } from "@/composables/core/useTinyI18nDocument";
import { useMessageChecked } from "@/composables/message/useMessageChecked";

const { load } = useTinyI18nDocument();
const { checkedIds } = useMessageChecked();
const messagesActionsToastId = "workspace-messages-actions";

onMounted(() => {
  void load();
});

watch(checkedIds, (ids) => {
  if (ids.size) {
    toast.custom(markRaw(MessagesActionsBar), {
      id: messagesActionsToastId,
      position: "bottom-center",
      duration: Number.POSITIVE_INFINITY,
    });
  } else {
    toast.dismiss();
  }
});
onBeforeUnmount(() => {
  toast.dismiss(messagesActionsToastId);
});
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden text-xs">
    <WorkspaceToolbar />

    <ResizablePanelGroup class="flex-1" direction="horizontal">
      <ResizablePanel :min-size="40" class="relative h-full">
        <WorkspaceMessageList class="p-3" />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel :min-size="40">
        <WorkspaceDetailPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>
