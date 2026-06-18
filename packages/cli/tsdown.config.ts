import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: false, // 必须为 false，保留 studio 拷贝过来的 dist 产物
})
