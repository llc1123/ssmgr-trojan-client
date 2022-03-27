import { Config } from '../config'
import { logger } from '../logger'
import Sentry from '../sentry'
import {
  AddResult,
  EDbType,
  FlowResult,
  ListResult,
  RemoveResult,
} from './types'

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

  public abstract getFlow(options?: { clear?: boolean }): Promise<FlowResult>

  public abstract disconnect(): void
}

const initDB = async (config: Config): Promise<DBClient> => {
  switch (config.dbType) {
    case EDbType.Redis:
      try {
        const { default: Redis } = await import('ioredis')
        const { RedisClient } = await import('./redis')
        const cl = new RedisClient(
          new Redis({
            port: config.dbPort,
            host: config.dbAddr,
            password: config.dbPassword,
          }),
        )
        logger.info(
          `Running in Redis mode. Connected to ${config.dbAddr}:${config.dbPort}`,
        )
        return cl
      } catch (e) {
        if (e instanceof Error) {
          Sentry.captureException(e)
          throw new Error(`Redis client init failed: ${e.message}`)
        }

        throw new Error(`Redis client init failed: ${e}`)
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
        if (e instanceof Error) {
          Sentry.captureException(e)
          throw new Error(`MySQL client init failed: ${e.message}`)
        }

        throw new Error(`MySQL client init failed: ${e}`)
      }
    case EDbType.API:
      try {
        const { APIClient } = await import('./api-client')
        const cl = new APIClient({
          host: config.dbAddr,
          port: config.dbPort,
        })
        logger.info(
          `Running in API mode. Connected to ${config.dbAddr}:${config.dbPort}`,
        )
        return cl
      } catch (e) {
        if (e instanceof Error) {
          Sentry.captureException(e)
          throw new Error(`API client init failed: ${e.message}`)
        }

        throw new Error(`API client init failed: ${e}`)
      }
    default:
      throw new Error(`Database ${config.dbType} not supported.`)
  }
}

export { DBClient, initDB }
