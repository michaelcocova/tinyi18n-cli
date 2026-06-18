import type { StartupInfo } from './types.ts'
import { networkInterfaces } from 'node:os'
import process from 'node:process'
import { green, red } from 'kolorist'
import { resolveCommand } from './commands.ts'
import { syncWorkspaceToProjectFiles } from './core/index.ts'
import {
  formatStartupInfo,
  printIgnoredDevelopmentPortNotice,
  printLines,
} from './output.ts'
import { resolvePortWithRetry, resolveRequestedPort } from './ports.ts'

import {
  resolveRuntimeMode,
  setupShortcuts,
  startWebDevServer,
  startWebDistServer,
} from './runtime.ts'

function getNetworkInterfaces() {
  const interfaces = networkInterfaces()
  const results: string[] = []

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        results.push(iface.address)
      }
    }
  }
  return results
}

export async function runCli(
  args: string[] = process.argv.slice(2),
  cwd: string = process.cwd(),
) {
  const resolved = await resolveCommand(args, cwd)

  if (!resolved.command) {
    process.exitCode = resolved.exitCode ?? 0
    return
  }

  const command = resolved.command

  if (command.type === 'generate') {
    const result = await syncWorkspaceToProjectFiles(command.projectRoot)
    if (!result.ok) {
      console.error(red(`生成失败：${(result as any).error || '未知错误'}`))
      process.exitCode = 1
    } else {
      console.log(green(`生成成功：共生成 ${result.files.length} 个文件`))
      process.exitCode = 0
    }
    return
  }

  const mode = resolveRuntimeMode()

  let hostname = '127.0.0.1'
  if (command.host === true || command.host === '') {
    hostname = '0.0.0.0'
  } else if (typeof command.host === 'string') {
    hostname = command.host
  } else if (process.env.TINYI18N_HOST) {
    hostname = process.env.TINYI18N_HOST
  }

  const requestedPort = resolveRequestedPort(command, mode)

  if (mode === 'development' && command.port != null) {
    printIgnoredDevelopmentPortNotice(command.port)
  }

  const port = await resolvePortWithRetry('ui', requestedPort, hostname)

  const urls = {
    local: [`http://localhost:${port}`],
    network: [] as string[],
  }

  if (hostname === '0.0.0.0' || hostname === '::') {
    urls.network = getNetworkInterfaces().map(ip => `http://${ip}:${port}`)
  } else if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
    urls.network = [`http://${hostname}:${port}`]
  }

  const webProcess
    = mode === 'development'
      ? startWebDevServer(command.projectRoot, port, hostname)
      : startWebDistServer(command.projectRoot, port, hostname)

  function stop() {
    webProcess?.kill('SIGTERM')
    process.exit(0)
  }

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)

  const info: StartupInfo = {
    mode,
    projectRoot: command.projectRoot,
    urls,
  }

  printLines(formatStartupInfo(info))
  setupShortcuts(info, stop)
}
