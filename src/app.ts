import { Socket, createServer } from 'net'
import { createHash } from 'crypto'

import { logger } from './logger'
import { DBClient, initDB } from './db-client/db'
import { parseConfig, Config } from './config'
import {
  ReceiveData,
  ECommand,
  UserFlow,
  UserIdPwd,
  ParsedResult,
} from './types'
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
 *      { type: 'list', data: [{ acctId: <number>, data: password<string> }, ...] }
 *  add (acctId<number>, password<string>)
 *    Attention: Based on trojan protocol, passwords must be unique.
 *    Passwords are stored in redis in SHA224 encoding (Don't pass encoded passwords).
 *    Use this method if you want to change password.
 *    return type:
 *      { type: 'add', data: acctId<number> }
 *  del (acctId<number>)
 *    Deletes an account by the given account ID
 *    return type:
 *      { type: 'del', data: acctId<number> }
 *  flow ()
 *    Returns flow data of all accounts since last flow query (including ones having no flow).
 *    It also lets you check active accounts. (In case redis has been wiped)
 *    return type:
 *      { type: 'flow', data: [{ acctId: <number>, data: flow<number> }, ...] }
 *  version ()
 *    Returns the version of this client.
 *    return type:
 *      { type: 'version', data: version<string> }
 */
const receiveCommand = async (data: Buffer): Promise<DBClientResult> => {
  interface CommandMessage {
    command: ECommand
    port: number
    password: string
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
      return await dbClient.listAccounts()
    case ECommand.Add:
      return await dbClient.addAccount(message.port, message.password)
    case ECommand.Delete:
      return await dbClient.removeAccount(message.port)
    case ECommand.Flow:
      return await dbClient.getFlow()
    case ECommand.Version:
      return { type: ECommand.Version, version: version }
    default:
      throw new Error('Invalid command: ' + message.command)
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
          flow: user.flow,
        }),
      )
    case ECommand.Version:
      return result.version
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
    const pack = Buffer.concat([lengthBuffer, dataBuffer])
    return pack
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
      const result = parseResult(await receiveCommand(data))
      receive.socket.end(pack({ code: 0, data: result }))
    } catch (err) {
      logger.error(err.message)
      receive.socket.end(
        pack({ code: err.message === 'Invalid command' ? 1 : -1 }),
      )
    }
    if (buffer.length > length + 2) {
      checkData(receive)
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
    checkData(receive)
  })
}).on('error', (err: Error) => {
  logger.error('Socket error: ', err.message)
})

const startServer = async (): Promise<void> => {
  logger.info(`ssmgr client for trojan v${version}`)

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

startServer().catch(() => logger.error('FATAL ERROR. TERMINATED.'))
