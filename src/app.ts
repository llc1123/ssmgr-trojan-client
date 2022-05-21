import { Socket, createServer } from 'net'
import { createHash } from 'crypto'

import { logger } from './logger'
import { DBClient, initDB } from './db-client/db'
import { parseConfig, Config } from './config'
import Sentry from './sentry'
import {
  ReceiveData,
  ECommand,
  UserFlow,
  UserIdPwd,
  ParsedResult,
} from './types'
import { assertNever } from './utils'
import { version } from './version'
import { DBClientResult } from './db-client/types'

let config: Config
let dbClient: DBClient

/**
 * @param data command message buffer
 *
 * Supported commands:
 *  list ()
 *    List current users and encoded passwords
 *    return type:
 *      { type: 'list', data: [{ id: <number>, password: password<string> }, ...] }
 *  add (acctId<number>, password<string>)
 *    Attention: Based on trojan protocol, passwords must be unique.
 *    Passwords are stored in redis in SHA224 encoding (Don't pass encoded passwords).
 *    Use this method if you want to change password.
 *    return type:
 *      { type: 'add', id: acctId<number> }
 *  del (acctId<number>)
 *    Deletes an account by the given account ID
 *    return type:
 *      { type: 'del', id: acctId<number> }
 *  flow ()
 *    Returns flow data of all accounts since last flow query (including ones having no flow).
 *    It also lets you check active accounts. (In case redis has been wiped)
 *    return type:
 *      { type: 'flow', data: [{ id: <number>, flow: flow<number> }, ...] }
 *  version ()
 *    Returns the version of this client.
 *    return type:
 *      { type: 'version', version: version<string> }
 */
const receiveCommand = async (data: Buffer): Promise<DBClientResult> => {
  interface CommandMessage {
    command: ECommand
    port: number
    password: string
    options?: {
      clear?: boolean
    }
    [key: string]: any
  }

  const message: CommandMessage = {
    command: ECommand.Version,
    port: 0,
    password: '',
    ...JSON.parse(data.slice(6).toString()),
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
          port: user.id,
          password: user.password,
        }),
      )
    case ECommand.Add:
      return { port: result.id }
    case ECommand.Delete:
      return { port: result.id }
    case ECommand.Flow:
      return result.data.map(
        (user): UserFlow => ({
          port: user.id,
          sumFlow: user.flow,
        }),
      )
    case ECommand.Version:
      return { version: result.version }
    default:
      throw new Error('Invalid command')
  }
}

const checkData = async (receive: ReceiveData): Promise<void> => {
  interface PackData {
    code: number
    data?: ParsedResult
  }

  const pack = (data: PackData): Buffer => {
    const message = JSON.stringify(data)
    const dataBuffer = Buffer.from(message)
    const length = dataBuffer.length
    const lengthBuffer = Buffer.from(
      length.toString(16).padStart(8, '0'),
      'hex',
    )
    return Buffer.concat([lengthBuffer, dataBuffer])
  }

  const checkCode = (data: Buffer, code: Buffer): boolean => {
    const time = Number.parseInt(data.slice(0, 6).toString('hex'), 16)
    if (Math.abs(Date.now() - time) > 10 * 60 * 1000) {
      logger.warn('Invalid message: Timed out.')
      return false
    }
    const command = data.slice(6).toString()
    const hash = createHash('md5')
      .update(time + command + config.key)
      .digest('hex')
      .substr(0, 8)
    if (hash === code.toString('hex')) {
      return true
    } else {
      logger.warn('Invalid message: Hash mismatch. (Incorrect password)')
      return false
    }
  }

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
    if (!checkCode(data, code)) {
      receive.socket.end(pack({ code: 2 }))
      return
    }
    try {
      const rawResult = await receiveCommand(data).catch((err: Error) => {
        Sentry.captureException(err, (scope) => {
          scope.setTags({
            phase: 'receiveCommand',
          })
          return scope
        })
        throw new Error(`Query error on '${rawResult.type}': ${err.message}`)
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
    if (buffer.length > length + 2) {
      checkData(receive).catch((err: Error) => {
        Sentry.captureException(err, (scope) => {
          scope.setTags({
            phase: 'checkData',
          })
          return scope
        })
        logger.error(err.message)
      })
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
