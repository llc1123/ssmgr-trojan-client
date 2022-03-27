import { getLogger } from 'log4js'

const logger = getLogger()
logger.level = process.env.LOG_LEVEL || 'info'

export { logger }
