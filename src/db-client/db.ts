import {
  EDbType,
  ListResult,
  AddResult,
  RemoveResult,
  FlowResult,
} from './types'
import { Config } from '../config'
import { logger } from '../logger'

/**
 * Database Client Abstract Class
 */
abstract class DBClient {
  public abstract listAccounts(): Promise<ListResult>

  public abstract addAccount(
    acctId: number,
    password: string,
  ): Promise<AddResult>

  public abstract removeAccount(acctId: number): Promise<RemoveResult>

  public abstract getFlow(): Promise<FlowResult>

  public abstract disconnect(): void
}

const initDB = async (config: Config): Promise<DBClient> => {
  switch (config.dbType) {
    case EDbType.Redis:
      try {
        const Redis = await import('ioredis')
        const { RedisClient } = await import('./redis')
        const cl = new RedisClient(
          new Redis({
            port: config.dbPort,
            host: config.dbAddr,
            password: config.dbPassword,
            db: +config.dbName || 0,
          }),
        )
        logger.info(
          `Running in Redis mode. Connected to ${config.dbAddr}:${config.dbPort}`,
        )
        return cl
      } catch (e) {
        logger.error(e.message)
        throw new Error()
      }
    case EDbType.MySQL:
      try {
        const MySQL = await import('promise-mysql')
        const { MySQLClient } = await import('./mysql')
        const cl = new MySQLClient(
          await MySQL.createConnection({
            host: config.dbAddr,
            port: config.dbPort,
            user: config.dbUser,
            password: config.dbPassword,
            database: config.dbName,
            debug: config.debug,
          }),
        )
        logger.info(
          `Running in MySQL mode. Connected to ${config.dbAddr}:${config.dbPort}`,
        )
        return cl
      } catch (e) {
        logger.error(e.message)
        throw new Error()
      }
    default:
      logger.error(`Database ${config.dbType} not supported.`)
      throw new Error()
  }
}

export { DBClient, initDB }
