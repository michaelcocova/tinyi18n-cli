import type { StartupInfo } from './types.ts'

import { bold, cyan, dim, green } from 'kolorist'

export function createShortcutHelp() {
  return [
    '',
    '  快捷键',
    '  按 h + enter 显示帮助',
    '  按 u + enter 显示服务地址',
    '  按 o + enter 在浏览器中打开',
    '  按 c + enter 清空控制台',
    '  按 q + enter 退出',
  ]
}

function withTrailingSlash(url: string) {
  return url.endsWith('/') ? url : `${url}/`
}

export function formatStartupInfo(info: StartupInfo) {
  const lines = [
    '',
    `  ${green(bold('TINYI18N UI 已启动'))}`,
    '',
    `  ${green('➜')}  ${bold('本地:')}   ${cyan(withTrailingSlash(info.urls.local[0] || ''))}`,
  ]

  if (info.urls.network.length > 0) {
    info.urls.network.forEach((url) => {
      lines.push(
        `  ${green('➜')}  ${bold('网络:')}   ${cyan(withTrailingSlash(url))}`,
      )
    })
  } else {
    lines.push(
      `  ${green('➜')}  ${bold('网络:')}   ${dim('使用 --host 暴露服务到局域网')}`,
    )
  }

  lines.push(
    `  ${green('➜')}  ${bold('项目:')}   ${info.projectRoot}`,
    `  ${green('➜')}  按 h + enter 显示帮助`,
  )

  return lines
}

export function printLines(lines: string[]) {
  console.log(lines.join('\n'))
}

export function printIgnoredDevelopmentPortNotice(port: number) {
  console.log(dim(`开发模式下已忽略 --port=${port} 参数。`))
}

export function filterErrorLog(chunk: string) {
  const text = chunk.trimEnd()

  if (!text) {
    return ''
  }

  const lines = text.split(/\r?\n/)
  const firstErrorIndex = lines.findIndex(line =>
    line.toLowerCase().includes('error'),
  )

  if (firstErrorIndex < 0) {
    return ''
  }

  return lines.slice(firstErrorIndex).join('\n')
}
