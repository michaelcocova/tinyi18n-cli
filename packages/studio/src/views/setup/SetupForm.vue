<script setup lang="ts">
import { useFieldArray, useFormValues } from "vee-validate";
import { Plus, Trash2, Globe, Settings2, Languages, Database } from "@lucide/vue";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/SearchableSelect.vue";
import { languageOptions } from "@/constants/language";

const props = defineProps<{
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  (e: "submit", payload: Event): void;
}>();

const values = useFormValues();

const { fields: customLocales, push: addLocale, remove: removeLocale } = useFieldArray("locales");
const { fields: customEntries, push: addEntry, remove: removeEntry } = useFieldArray("entries");

function parsePaths(val: string | number) {
  if (!val) return [];
  return val
    .toString()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
</script>

<template>
  <form @submit.prevent="$emit('submit', $event)" class="space-y-6 mt-6">
    <!-- Data Filename -->
    <FormField name="filename" v-slot="{ componentField }">
      <FormItem>
        <div class="flex items-center gap-2">
          <Database class="size-5 text-zinc-400" />
          <Label class="text-sm font-medium">数据文件名 (Filename)</Label>
        </div>
        <FormDescription class="text-xs text-zinc-500">
          工作区存储所有翻译数据的 JSON 文件名称; 默认".data.json"。
        </FormDescription>
        <FormControl>
          <Input v-bind="componentField" placeholder="数据文件名" class="max-w-md" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <!-- Locales -->
    <div class="group flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <Languages class="size-5 text-zinc-400" />
        <Label class="text-sm font-medium">多语言配置 (Locales)</Label>
        <Button
          type="button"
          class="transition-opacity duration-150 opacity-0 group-hover:opacity-100 ml-auto"
          variant="ghost"
          size="icon-sm"
          @click="addLocale({ code: '', filename: '' })"
        >
          <Plus class="size-4" />
        </Button>
      </div>
      <table class="w-full table-fixed">
        <colgroup>
          <col />
          <col />
          <col class="w-10" />
        </colgroup>
        <thead>
          <tr class="text-left text-xs font-medium text-zinc-500">
            <th class="pb-2 pr-2 font-normal">语言 (Language)</th>
            <th class="pb-2 px-2 font-normal">输出文件名 (可选)</th>
            <th class="pb-2"></th>
          </tr>
        </thead>
        <tbody class="[&_td]:align-top [&_td]:px-1 [&_td]:pb-6">
          <tr v-for="(field, idx) in customLocales" :key="field.key">
            <td class="pr-2 pb-3 align-top">
              <FormField :name="`locales[${idx}].code`" v-slot="{ componentField }">
                <FormItem>
                  <FormControl>
                    <SearchableSelect
                      v-bind="componentField"
                      :options="languageOptions"
                      :searchFields="['value', 'label']"
                      placeholder="搜索或选择语言"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </td>
            <td class="px-2 pb-3 align-top">
              <FormField :name="`locales[${idx}].filename`" v-slot="{ componentField }">
                <FormItem>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      :placeholder="
                        (values.locales || [])[idx]?.code
                          ? `${(values.locales || [])[idx].code}.json`
                          : ''
                      "
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </td>
            <td class="pl-2 pb-3 align-top pt-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="text-zinc-400 hover:text-destructive"
                @click="removeLocale(idx)"
                :disabled="customLocales.length === 1"
                v-if="idx > 0 || customLocales.length > 1"
              >
                <Trash2 class="size-4" />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Entries -->
    <div class="group flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <Settings2 class="size-5 text-zinc-400" />
        <Label class="text-sm font-medium">源码入口配置 (Entries)</Label>
        <Button
          type="button"
          class="transition-opacity duration-150 opacity-0 group-hover:opacity-100 ml-auto"
          variant="ghost"
          size="icon-sm"
          @click="addEntry({ dir: '', paths: [] })"
        >
          <Plus class="size-4" />
        </Button>
      </div>
      <table class="w-full table-fixed">
        <colgroup>
          <col />
          <col />
          <col class="w-10" />
        </colgroup>
        <thead>
          <tr class="text-left text-xs font-medium text-zinc-500">
            <th class="pb-2 pr-2 font-normal">源码目录 (Dir)</th>
            <th class="pb-2 px-2 font-normal">路径 (Paths)</th>
            <th class="pb-2"></th>
          </tr>
        </thead>
        <tbody class="[&_td]:align-top [&_td]:px-1 [&_td]:pb-6">
          <tr v-for="(field, idx) in customEntries" :key="field.key">
            <td>
              <FormField :name="`entries[${idx}].dir`" v-slot="{ componentField }">
                <FormItem>
                  <FormControl>
                    <Input v-bind="componentField" placeholder="src/locales" class="flex-1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </td>
            <td>
              <FormField :name="`entries[${idx}].paths`" v-slot="{ componentField, handleChange }">
                <FormItem>
                  <FormControl>
                    <Input
                      :model-value="(componentField.modelValue || []).join(', ')"
                      @update:model-value="handleChange(parsePaths($event))"
                      placeholder="common, home"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </td>
            <td>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="text-zinc-400 hover:text-destructive"
                @click="removeEntry(idx)"
              >
                <Trash2 class="size-4" />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Submit -->
    <div class="pt-6">
      <Button type="submit" size="lg" class="w-full h-10" :disabled="isSubmitting">
        <Globe class="size-4 mr-2" />
        {{ isSubmitting ? "初始化中..." : "生成配置文件并初始化" }}
      </Button>
    </div>
  </form>
</template>
