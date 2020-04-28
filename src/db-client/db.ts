import { DBClientResult, EDbType } from '../types'
import { Config } from '../config'
import { logger } from '../logger'

/**
 * Database Client Abstract Class
 */
abstract class DBClient {
  public abstract addAccount(
    acctId: number,
    password: string,
  ): Promise<DBClientResult>

  public abstract removeAccount(acctId: number): Promise<DBClientResult>

  public abstract getFlow(): Promise<DBClientResult>

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
    default:
      logger.error('Database not supported')
      throw new Error()
  }
}

export { DBClient, initDB }
