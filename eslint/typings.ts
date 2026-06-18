import type { Linter } from 'eslint'

export const typingsLinter: Linter.Config = {
  files: ['typings/**/*.d.ts'],

  rules: {
    // Node 全局类型声明会触发
    'n/prefer-global/buffer': 'off',
    'n/prefer-global/process': 'off',

    // 允许 interface 合并
    'ts/no-redeclare': 'off',

    // declaration 文件中经常需要 namespace
    'ts/no-namespace': 'off',

    // 允许空 interface
    'ts/no-empty-object-type': 'off',

    // declaration 文件中未使用参数无意义
    'unused-imports/no-unused-vars': 'off',

    // declaration 文件不检查 import
    'unused-imports/no-unused-imports': 'off',
  },
}
