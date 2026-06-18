<script setup lang="ts">
import { Check, ChevronDown } from '@lucide/vue'

export interface SearchableSelectItem {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    options: SearchableSelectItem[]
    modelValue?: string
    placeholder?: string
    searchFields?: ('label' | 'value')[]
  }>(),
  {
    searchFields: () => ['label'],
  },
)

const modelValue = defineModel<string>({
  default: '',
})
const open = ref(false)

function filterFunction(list: any[], search: string) {
  const searchTerm = search.toLowerCase()
  return list.filter((i) => {
    return props.searchFields.some((field) => {
      const targetValue = i[field]
      return targetValue && targetValue.toLowerCase().includes(searchTerm)
    })
  })
}
function handleSelect(value: string) {
  modelValue.value = value
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        class="w-full justify-between font-normal px-3"
      >
        {{
          modelValue
            ? options.find((opt) => opt.value === modelValue)?.label
            : placeholder || "请选择..."
        }}
        <ChevronDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-full p-0">
      <Command :filter-function="filterFunction">
        <CommandInput
          class="h-9"
          :placeholder="placeholder || '搜索...'"
        />
        <CommandEmpty>未找到结果</CommandEmpty>
        <CommandList>
          <CommandGroup>
            <CommandItem
              v-for="opt in options"
              :key="opt.value"
              :value="opt"
              @select="handleSelect(opt.value)"
            >
              {{ opt.label }}
              <Check
                :class="
                  cn(
                    'ml-auto h-4 w-4',
                    modelValue === opt.value ? 'opacity-100' : 'opacity-0',
                  )
                "
              />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
