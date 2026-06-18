import type { TinyI18nCommand, TinyI18nMode } from './types.ts'
import { execSync } from 'node:child_process'
import { createServer as createNetServer } from 'node:net'

import process from 'node:process'
import { yellow } from 'kolorist'

import prompts from 'prompts'

const DEFAULT_UI_PORT = 1772

function normalizePort(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    return DEFAULT_UI_PORT
  }

  return value
}

export function parseRetryPort(input: string, currentPort: number) {
  const value = input.trim()

  if (!value) {
    return currentPort
  }

  return normalizePort(Number(value))
}

async function askRetryPort(name: string, port: number) {
  console.log(`\n  ${yellow(`${name} 端口 ${port} 已被占用。`)}\n`)

  const response = await prompts(
    {
      type: 'select',
      name: 'action',
      message: '请选择处理方式',
      choices: [
        { title: `停止占用端口 ${port} 的进程`, value: 'kill' },
        { title: `重试端口 ${port}`, value: 'retry' },
        { title: `自动增加端口号 (${port + 1})`, value: 'next' },
        { title: `手动输入新端口号`, value: 'input' },
      ],
    },
    {
      onCancel: () => {
        process.exit(130)
      },
    },
  )

  if (response.action === 'kill') {
    try {
      execSync(`lsof -ti tcp:${port} | xargs kill`)
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (e: any) {
      console.error(
        yellow(`无法终止端口 ${port} 的进程，请手动尝试。`),
        e?.message,
      )
    }
    return port
  }

  if (response.action === 'retry') {
    return port
  }

  if (response.action === 'next') {
    return port + 1
  }

  if (response.action === 'input') {
    const inputResponse = await prompts(
      {
        type: 'text',
        name: 'port',
        message: '新端口',
        initial: '',
      },
      {
        onCancel: () => {
          process.exit(130)
        },
      },
    )
    return parseRetryPort(String(inputResponse.port ?? ''), port)
  }

  return port
}

function isPortAvailable(port: number, hostname: string) {
  return new Promise<boolean>((resolve) => {
    const server = createNetServer()

    server.once('error', () => {
      resolve(false)
    })

    server.once('listening', () => {
      server.close(() => {
        resolve(true)
      })
    })

    server.listen(port, hostname)
  })
}

export async function resolvePortWithRetry(
  name: string,
  port: number,
  hostname: string,
) {
  let nextPort = port

  while (true) {
    if (await isPortAvailable(nextPort, hostname)) {
      return nextPort
    }

    nextPort = await askRetryPort(name, nextPort)
  }
}

export function resolveRequestedPort(
  command: TinyI18nCommand,
  mode: TinyI18nMode,
  env: NodeJS.ProcessEnv = process.env,
) {
  const defaultPort = normalizePort(
    Number(env.TINYI18N_PORT ?? env.TINYI18N_WEB_PORT ?? DEFAULT_UI_PORT),
  )

  if (mode === 'production' && command.type === 'ui' && command.port != null) {
    return command.port
  }

  return defaultPort
}
