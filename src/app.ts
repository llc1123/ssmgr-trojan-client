import onDeath from 'death'
import { ExecaChildProcess } from 'execa'
import { createServer, Socket } from 'net'
import { Config, parseConfig } from './config'
import { DBClient, initDB } from './db-client/db'
import { DBClientResult } from './db-client/types'
import { logger } from './logger'
import Sentry from './sentry'

import { checkCode, pack } from './socket'
import { startTrojan } from './trojan'
import {
  CommandMessage,
  ECommand,
  ParsedResult,
  ReceiveData,
  UserFlow,
  UserIdPwd,
} from './types'
import { assertNever } from './utils'
import { version } from './version'

let config: Config
let dbClient: DBClient
let trojanProcess: ExecaChildProcess | null = null

/**
 * https://shadowsocks.github.io/shadowsocks-manager/#/ssmgrapi
 */
const receiveCommand = async (
  data: CommandMessage,
): Promise<DBClientResult> => {
  interface MergedCommandMessage {
    command: ECommand
    port: number
    password: string
    options?: {
      clear?: boolean
    }
    [key: string]: any
  }

  const message: MergedCommandMessage = {
    command: ECommand.Version,
    port: 0,
    password: '',
    ...data,
  }
  logger.info('Message received: ' + JSON.stringify(message))

  switch (message.command) {
    case ECommand.List:
      return dbClient.listAccounts()
    case ECommand.Add:
      return dbClient.addAccount(message.port, message.password)
    case ECommand.Delete:
      return dbClient.removeAccount(message.port)
    case ECommand.Flow:
      return dbClient.getFlow(message.options)
    case ECommand.ChangePassword:
      return dbClient.changePassword(message.port, message.password)
    case ECommand.Version:
      return { type: ECommand.Version, version: version }
    default:
      return assertNever(message.command)
  }
}

const parseResult = (result: DBClientResult): ParsedResult => {
  switch (result.type) {
    case ECommand.List:
      return result.data.map(
        (user): UserIdPwd => ({
          port: user.accountId,
          password: user.password,
        }),
      )
    case ECommand.Add:
      return { port: result.accountId }
    case ECommand.Delete:
      return { port: result.accountId }
    case ECommand.Flow:
      return result.data.map(
        (user): UserFlow => ({
          port: user.accountId,
          sumFlow: user.flow,
        }),
      )
    case ECommand.ChangePassword:
      return { port: result.accountId, password: result.password }
    case ECommand.Version:
      return { version: result.version }
    default:
      return assertNever(result)
  }
}

const checkData = async (receive: ReceiveData): Promise<void> => {
  const buffer = receive.data
  let length = 0
  let data: Buffer
  let code: Buffer

  if (buffer.length < 2) {
    return
  }

  length = buffer[0] * 256 + buffer[1]

  if (buffer.length >= length + 2) {
    data = buffer.slice(2, length - 2)
    code = buffer.slice(length - 2)

    if (!checkCode(config.key, data, code)) {
      receive.socket.end(pack({ code: 2 }))
      return
    }

    try {
      const payload = JSON.parse(data.slice(6).toString()) as CommandMessage
      const rawResult = await receiveCommand(payload).catch((err: Error) => {
        Sentry.captureException(err, (scope) => {
          scope.setTags({
            phase: 'receiveCommand',
          })
          return scope
        })
        if (payload.command) {
          throw new Error(`Query error on '${payload.command}': ${err.message}`)
        } else {
          throw new Error(`Query error: ${err.message}`)
        }
      })
      const result = parseResult(rawResult)

      logger.debug('Result: ' + JSON.stringify(result, null, 2))

      receive.socket.end(pack({ code: 0, data: result }))
    } catch (err) {
      if (err instanceof Error) {
        logger.error(err.message)

        receive.socket.end(
          pack({ code: err.message === 'Invalid command' ? 1 : -1 }),
        )
      }
    }
  }
}

const server = createServer((socket: Socket) => {
  const receive: ReceiveData = {
    data: Buffer.from(''),
    socket,
  }

  socket.on('data', (data: Buffer) => {
    receive.data = Buffer.concat([receive.data, data])

    checkData(receive).catch((err: Error) => {
      Sentry.captureException(err, (scope) => {
        scope.setTags({
          phase: 'checkData',
        })
        return scope
      })
      logger.error(err.message)
    })
  })

  socket.on('error', (err: Error) => {
    Sentry.captureException(err, (scope) => {
      scope.setTags({
        phase: 'socket:error',
      })
      return scope
    })
    logger.error('Socket error: ', err.message)
  })
}).on('error', (err: Error) => {
  Sentry.captureException(err, (scope) => {
    scope.setTags({
      phase: 'server:error',
    })
    return scope
  })
  logger.error('TCP server error: ', err.message)
})

const startServer = async (): Promise<void> => {
  logger.info(`Running ssmgr-trojan-client v${version}`)

  config = parseConfig()

  if (config.debug) {
    logger.level = 'debug'
  }

  logger.debug(JSON.stringify(config))

  if (config.trojanConfig) {
    trojanProcess = startTrojan(config.trojanConfig)

    trojanProcess.on('exit', (code) => {
      if (code === 1) {
        logger.error(`trojan-go process exited with code ${code}`)
        dbClient.disconnect()
        server.close()

        process.exit(1)
      }
    })
  }

  dbClient = await initDB(config)

  server.listen(config.port, config.addr, () => {
    logger.info(`Listening on ${config.addr}:${config.port}`)
  })
}

startServer().catch((e) => {
  if (e instanceof Error) {
    logger.error(e.message)
    Sentry.captureException(e, (scope) => {
      scope.setTags({
        phase: 'startServer',
      })
      return scope
    })
  } else {
    logger.error(e)
  }
  logger.error('FATAL ERROR. TERMINATED.')
  process.exit(1)
})

onDeath({ debug: true, uncaughtException: false })((signal) => {
  logger.info(`Received ${signal}. Terminating the service...`)
  if (trojanProcess) {
    trojanProcess.kill(0)
  }
  dbClient.disconnect()
  server.close()
})
