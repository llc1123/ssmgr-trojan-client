import { Socket, createServer } from 'net'
import { createHash } from 'crypto'
import { program } from 'commander'

import { logger } from './logger'
import { DBClient } from './db-client/db'

program
  .option('-d, --debug', 'default: false  verbose output for debug infomation')
  .option(
    '-l, --listen-address <addr:port>',
    'default: 0.0.0.0:4001  listening address for manager',
    '0.0.0.0:4001',
  )
  .option('-k, --key <password>', 'ssmgr client password', '')
  .option('--db-type', 'default: redis  database type (redis/mysql)', 'redis')
  .option(
    '--db-address <addr:port>',
    'default: localhost:6379(redis)/localhost:3306(mysql)  database address',
    'localhost',
  )
  .option(
    '--db-user <username>',
    'defualt: none(redis)/trojan(mysql)  database username',
    '',
  )
  .option('--db-password <password>', 'default: none  database password', '')
  .parse(process.argv)

enum EDbType {
  Redis = 'redis',
  MySQL = 'mysql',
}

interface Config {
  debug: boolean
  addr: string
  port: number
  key: string
  dbType: EDbType
  dbAddr: string
  dbPort: number
  dbUser: string
  dbPassword: string
}

const config: Config = {
  debug: program.debug ? true : false,
  addr: program.listenAddress?.split(':')[0] || '0.0.0.0',
  port: parseInt(program.listenAddress?.split(':')[1], 10) || 4001,
  key: program.key || Math.random().toString(36).substring(2, 15),
  dbType: (program.dbType as EDbType) || EDbType.Redis,
  dbAddr: program.dbAddress?.split(':')[0] || 'localhost',
  dbPort:
    parseInt(program.dbAddress?.split(':')[1], 10) ||
    program.dbType === EDbType.MySQL
      ? 3306
      : 6379,
  dbUser: program.dbUser || program.dbType === EDbType.MySQL ? 'trojan' : '',
  dbPassword: program.dbPassword || '',
}

if (config.debug) {
  logger.level = 'debug'
}

let trojanClient: DBClient

switch (config.dbType) {
  case EDbType.Redis:
    const Redis = await import('ioredis')
    const { RedisClient } = await import('./db-client/redis')
    trojanClient = new RedisClient(
      new Redis({
        port: config.dbPort,
        host: config.dbAddr,
        password: config.dbPassword,
      }),
    )
}

export interface DBClientResult {
  acctId?: number
  flow?: {
    acctId: number
    flow: number
  }[]
  version?: string
}

/**
 * @param data command message buffer
 *
 * Supported commands:
 *  add (acctId<number>, password<string>)
 *    Attention: Based on trojan protocol, passwords must be unique.
 *    Passwords are stored in redis in SHA224 encoding (Don't pass encoded passwords).
 *    Use this method if you want to change password.
 *    return type:
 *      { acctId: <number> }
 *  del (acctId<number>)
 *    Deletes an account by the given account ID
 *    return type:
 *      { acctId: <number> }
 *  flow ()
 *    Returns flow data of all accounts since last flow query (including ones having no flow).
 *    It also lets you check active accounts. (In case redis has been wiped)
 *    return type:
 *      { flow: [{ acctId: <number>, flow: <number> }, ...] }
 *  version ()
 *    Returns the version of this client.
 *    return type:
 *      { version: <string> }
 */
const receiveCommand = async (data: Buffer): Promise<DBClientResult> => {
  enum ECommand {
    Add = 'add',
    Delete = 'del',
    Flow = 'flow',
    Version = 'version',
  }
  interface CommandMessage {
    command: ECommand
    acctId: number
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
    case ECommand.Add:
      return await trojanClient.addAccount(message.acctId, message.password)
    case ECommand.Delete:
      return await trojanClient.removeAccount(message.acctId)
    case ECommand.Flow:
      return await trojanClient.getFlow()
    case ECommand.Version:
      return { version: process.env.npm_package_version }
    default:
      throw new Error('Invalid command')
  }
}

interface ReceiveData {
  data: Buffer
  socket: Socket
}

const checkData = async (receive: ReceiveData): Promise<void> => {
  interface PackData {
    code: number
    data?: DBClientResult
  }

  const pack = (data: PackData): Buffer => {
    const message = JSON.stringify(data)
    const dataBuffer = Buffer.from(message)
    const length = dataBuffer.length
    const lengthBuffer = Buffer.from(length.toString(16).padStart(8), 'hex')
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
      const result = await receiveCommand(data)
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

const startServer = (): void => {
  logger.info(
    `ssmgr client for trojan-redis v${process.env.npm_package_version}`,
  )
  if (!program.key) {
    logger.warn(`Password not specified. Using random password {${config.key}}`)
  }
  console.log(JSON.stringify(config))
  server.listen(config.port, config.addr, () => {
    logger.info(`Listening on ${config.addr}:${config.port}`)
  })
}

startServer()
