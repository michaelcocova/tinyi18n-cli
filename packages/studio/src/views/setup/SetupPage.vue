<script setup lang="ts">
import { computed, ref } from 'vue'
import { useInitForm } from '../../composables/useInitForm'
import { getWebConfig } from '../../web-config'
import SetupForm from './SetupForm.vue'
import SetupPreview from './SetupPreview.vue'

const form = useInitForm()

const generatedCode = computed(() => {
  const values = form.values

  const config: Record<string, any> = {
    filename: values.filename || '.data.json',
    locales: (values.locales || [])
      .filter((l: any) => l.code)
      .map((l: any) => ({
        code: l.code,
        filename: l.filename || `${l.code}.json`,
      })),
  }

  const entries = (values.entries || [])
    .filter((e: any) => e.dir)
    .map((e: any) => ({
      dir: e.dir,
      paths: e.paths || [],
    }))

  if (entries.length > 0) {
    config.entries = entries
  }

  // Generate JS object string, removing quotes around keys for better readability
  const configString = JSON.stringify(config, null, 2).replace(
    /"([^"]+)":/g,
    '$1:',
  )

  return `import { defineConfig } from "tinyi18n-cli";\n\nexport default defineConfig(${configString});\n`
})

const isSubmitting = ref(false)

const onSubmit = form.handleSubmit(async (values) => {
  try {
    isSubmitting.value = true

    // Generate config object removing undefined values and old keys.
    const config: Record<string, any> = {
      filename: values.filename || '.data.json',
      locales: (values.locales || []).map((locale: any) => ({
        code: locale.code,
        filename: locale.filename || `${locale.code}.json`,
      })),
    }

    if (values.entries && values.entries.length > 0) {
      config.entries = values.entries.map((entry: any) => ({
        dir: entry.dir,
        paths: entry.paths?.filter((p: string) => p.trim() !== '') || [],
      }))
    }

    const response = await fetch(`${getWebConfig().apiBase}/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      throw new Error(`Failed to initialize: ${response.statusText}`)
    }

    window.location.reload()
  }
  catch (error) {
    console.error(error)
  }
  finally {
    isSubmitting.value = false
  }
})
</script>

<template>
  <div class="min-h-svh bg-background flex items-center box-border">
    <div
      class="mx-auto max-w-5xl w-full gap-6 grid lg:grid-cols-[1fr_400px] items-start"
    >
      <div class="flex-1 flex flex-col min-h-svh justify-center py-10">
        <h1 class="text-xl font-bold tracking-tight sm:text-3xl">
          欢迎使用 TinyI18n
        </h1>
        <p
          class="mt-5 max-w-md text-base leading-relaxed text-muted-foreground"
        >
          让我们通过几个简单的步骤来初始化你的工作区配置。
        </p>
        <SetupForm
          :is-submitting="isSubmitting"
          @submit="onSubmit"
        />
      </div>
      <SetupPreview :code="generatedCode" />
    </div>
  </div>
</template>
