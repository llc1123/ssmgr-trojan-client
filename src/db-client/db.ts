import { Config } from '../types'
import { logger } from '../logger'
import Sentry from '../sentry'
import {
  AddResult,
  ChangePasswordResult,
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
    accountId: number,
    password: string,
  ): Promise<AddResult>

  public abstract removeAccount(accountId: number): Promise<RemoveResult>

  public abstract changePassword(
    accountId: number,
    password: string,
  ): Promise<ChangePasswordResult>

  public abstract getFlow(options?: { clear?: boolean }): Promise<FlowResult>

  public abstract disconnect(): void
}

const initDB = async (config: Config): Promise<DBClient> => {
  try {
    const { APIClient } = await import('./api-client')
    const cl = new APIClient({
      host: config.apiHost,
      port: config.apiPort,
    })
    logger.info(
      `Running in API mode. API address: ${config.apiHost}:${config.apiPort}`,
    )
    return cl
  } catch (e) {
    if (e instanceof Error) {
      Sentry.captureException(e)
      throw new Error(`API client init failed: ${e.message}`)
    }

    throw new Error(`API client init failed: ${e}`)
  }
}

export { DBClient, initDB }
