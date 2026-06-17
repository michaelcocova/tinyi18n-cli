<script setup lang="ts">
import { CircleAlert, Database, FileCode2, Languages, RefreshCw, Sparkles } from "@lucide/vue";
</script>

<template>
  <div class="flex min-h-full items-center justify-center p-4 md:p-8">
    <section class="mx-auto w-full max-w-6xl p-4">
      <div style="opacity: 1; transform: none">
        <div class="text-center">
          <p class="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            能力概览
          </p>
          <h2 class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            一个工作区主链路，五个辅助能力。
          </h2>
          <p class="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            TinyI18n 通过同一条本地服务流读取 config、snapshot 和 locale
            文件，让整个工作区的数据状态一眼可见。
          </p>
        </div>
        <div class="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            class="flex flex-col overflow-hidden rounded-xl border bg-card sm:col-span-2 lg:col-span-2 lg:row-span-2"
            style="opacity: 1; transform: none"
          >
            <div class="flex items-center gap-2.5 border-b px-5 py-3.5">
              <span class="flex size-7 items-center justify-center rounded-md bg-muted">
                <Sparkles class="size-3.5 text-muted-foreground" aria-hidden="true" /> </span
              ><span
                class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >核心工作区</span
              ><span
                class="ml-auto flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground"
                ><span aria-hidden="true" class="size-1.5 rounded-full bg-emerald-500"></span
                >实时同步</span
              >
            </div>
            <div class="flex-1 border-b bg-muted/30 p-5">
              <div class="space-y-3">
                <div>
                  <div
                    class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    工作区输入
                  </div>
                  <div
                    class="mt-1.5 rounded-md border bg-card px-3 py-2 font-mono text-xs text-foreground"
                  >
                    <span class="text-muted-foreground">"</span>.tinyi18n/config.ts +
                    .tinyi18n/data.json + locale files<span class="text-muted-foreground">"</span>
                  </div>
                </div>
                <div>
                  <div
                    class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    解析结果
                  </div>
                  <div class="mt-1.5 divide-y rounded-md border bg-card">
                    <div class="flex items-center gap-2 px-3 py-2 font-mono text-xs">
                      <span
                        class="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        >配置</span
                      ><span class="truncate text-foreground">config.ts 已加载</span
                      ><span class="ml-auto shrink-0 text-muted-foreground">就绪</span>
                    </div>
                    <div class="flex items-center gap-2 px-3 py-2 font-mono text-xs">
                      <span
                        class="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[9px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        >快照</span
                      ><span class="truncate text-foreground">已索引 3,215 条消息</span
                      ><span class="ml-auto shrink-0 text-muted-foreground">data.json</span>
                    </div>
                    <div class="flex items-center gap-2 px-3 py-2 font-mono text-xs">
                      <span
                        class="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[9px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        >语言</span
                      ><span class="truncate text-foreground">zh-CN.json</span
                      ><span class="ml-auto shrink-0 text-muted-foreground">默认</span>
                    </div>
                    <div class="flex items-center gap-2 px-3 py-2 font-mono text-xs">
                      <span
                        class="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[9px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        >语言</span
                      ><span class="truncate text-foreground">en.json</span
                      ><span class="ml-auto shrink-0 text-muted-foreground">已关联</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="p-5">
              <h3 class="text-base font-semibold tracking-tight">
                通过同一条服务流完成本地工作区编排
              </h3>
              <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
                TinyI18n UI 通过同一个本地服务入口解析项目配置、 快照数据和 locale
                资源，先保证读取链路一致，后续再接入安全写回。
              </p>
              <div class="mt-4 grid gap-2 sm:grid-cols-3">
                <div
                  class="rounded-md border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground"
                >
                  已连接 2 个语言文件
                </div>
                <div
                  class="rounded-md border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground"
                >
                  已索引 3,215 条消息
                </div>
                <div
                  class="rounded-md border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground"
                >
                  Nitro 服务已就绪
                </div>
              </div>
            </div>
          </div>
          <div
            class="flex flex-col rounded-xl border bg-card p-5"
            style="opacity: 1; transform: none"
          >
            <div class="flex items-start justify-between gap-3">
              <span class="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Database class="size-4 text-muted-foreground" aria-hidden="true" />
              </span>
              <div class="text-right">
                <div class="text-xl font-semibold tabular-nums text-foreground">3,215</div>
                <div class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  已索引键
                </div>
              </div>
            </div>
            <h3 class="mt-4 text-sm font-semibold">快照索引</h3>
            <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
              读取 .tinyi18n/data.json，并为工作区暴露稳定的消息图谱。
            </p>
            <div aria-hidden="true" class="mt-auto flex h-6 items-end gap-[3px] pt-4">
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 35%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 44%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 42%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 55%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 60%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 58%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 70%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 78%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 82%"></div>
              <div class="flex-1 rounded-[1px] bg-foreground/40" style="height: 96%"></div>
            </div>
          </div>
          <div
            class="flex flex-col rounded-xl border bg-card p-5"
            style="opacity: 1; transform: none"
          >
            <div class="flex items-start justify-between gap-3">
              <span class="flex size-9 items-center justify-center rounded-lg bg-muted">
                <FileCode2 class="size-4 text-muted-foreground" aria-hidden="true" />
              </span>
              <div class="text-right">
                <div class="text-xl font-semibold tabular-nums text-foreground">.ts</div>
                <div class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  配置来源
                </div>
              </div>
            </div>
            <h3 class="mt-4 text-sm font-semibold">配置解析</h3>
            <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
              加载 .tinyi18n/config.ts，并标准化 locales、entries 和默认目标。
            </p>
            <div aria-hidden="true" class="mt-auto flex h-6 items-end gap-[3px] pt-4">
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 88%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 74%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 70%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 62%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 55%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 48%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 40%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 32%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 24%"></div>
              <div class="flex-1 rounded-[1px] bg-foreground/40" style="height: 18%"></div>
            </div>
          </div>
          <div
            class="flex flex-col rounded-xl border bg-card p-5"
            style="opacity: 1; transform: none"
          >
            <div class="flex items-start justify-between gap-3">
              <span class="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Languages class="size-4 text-muted-foreground" aria-hidden="true" />
              </span>
              <div class="text-right">
                <div class="text-xl font-semibold tabular-nums text-foreground">2</div>
                <div class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  语言文件
                </div>
              </div>
            </div>
            <h3 class="mt-4 text-sm font-semibold">语言关联</h3>
            <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
              把配置里的 locale 文件关联到工作区图谱和翻译路径上。
            </p>
            <div aria-hidden="true" class="mt-auto flex h-6 items-end gap-[3px] pt-4">
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 42%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 48%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 55%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 52%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 65%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 72%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 78%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 84%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 88%"></div>
              <div class="flex-1 rounded-[1px] bg-foreground/40" style="height: 94%"></div>
            </div>
          </div>
          <div
            class="flex flex-col rounded-xl border bg-card p-5"
            style="opacity: 1; transform: none"
          >
            <div class="flex items-start justify-between gap-3">
              <span class="flex size-9 items-center justify-center rounded-lg bg-muted">
                <CircleAlert class="size-4 text-muted-foreground" aria-hidden="true" />
              </span>
              <div class="text-right">
                <div class="text-xl font-semibold tabular-nums text-foreground">42</div>
                <div class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  待处理项
                </div>
              </div>
            </div>
            <h3 class="mt-4 text-sm font-semibold">问题扫描</h3>
            <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
              找出缺失键、空值和重复路径，方便继续人工检查。
            </p>
            <div aria-hidden="true" class="mt-auto flex h-6 items-end gap-[3px] pt-4">
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 50%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 58%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 62%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 68%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 65%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 74%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 80%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 82%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 78%"></div>
              <div class="flex-1 rounded-[1px] bg-foreground/40" style="height: 92%"></div>
            </div>
          </div>
          <div
            class="flex flex-col rounded-xl border bg-card p-5"
            style="opacity: 1; transform: none"
          >
            <div class="flex items-start justify-between gap-3">
              <span class="flex size-9 items-center justify-center rounded-lg bg-muted">
                <RefreshCw class="size-4 text-muted-foreground" aria-hidden="true" />
              </span>
              <div class="text-right">
                <div class="text-xl font-semibold tabular-nums text-foreground">就绪</div>
                <div class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  服务链路
                </div>
              </div>
            </div>
            <h3 class="mt-4 text-sm font-semibold">写回链路</h3>
            <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
              先稳定当前读取流程，再通过同一层 Nitro 服务安全接入文件写回。
            </p>
            <div aria-hidden="true" class="mt-auto flex h-6 items-end gap-[3px] pt-4">
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 96%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 97%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 98%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 97%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 99%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 98%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 99%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 99%"></div>
              <div class="flex-1 rounded-[1px] bg-muted-foreground/20" style="height: 98%"></div>
              <div class="flex-1 rounded-[1px] bg-foreground/40" style="height: 99%"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped></style>
