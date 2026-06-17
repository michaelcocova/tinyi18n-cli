<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { ErrorMessage } from "vee-validate";
import { toValue } from "vue";
import { cn } from "@/utils/tailwind";
import { useFormField } from "./useFormField";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const { name, formMessageId } = useFormField();
</script>

<template>
  <ErrorMessage
    :id="formMessageId"
    data-slot="form-message"
    as="p"
    :name="toValue(name)"
    :class="cn('absolute -bottom-5 text-destructive text-sm', props.class)"
  />
</template>
