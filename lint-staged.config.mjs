/**
 * 仅处理已暂存文件，避免在提交前扫描整个仓库。
 * 当前只做格式化，保证提交内容的基本一致性。
 */
const config = {
  '*.{ts,js,vue,mjs,cjs}': ['eslint --fix'],
  '*.{json,md,yml,yaml}': ['eslint --fix'],
}

export default config
