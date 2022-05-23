import { logger } from '../logger'
import Sentry from '../sentry'
import { Config } from '../types'
import { APIClient } from './api-client'

export const getClient = async (config: Config): Promise<APIClient> => {
  try {
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

export * from './api-client'
export * from './types'
