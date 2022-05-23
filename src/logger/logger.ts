import { getLogger } from 'log4js'

const logger = getLogger()
const trojanLogger = getLogger('trojan')

logger.level = process.env.LOG_LEVEL || 'info'
trojanLogger.level = 'debug'

export { logger, trojanLogger }
