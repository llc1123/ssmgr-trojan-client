import { getLogger } from 'log4js'

const logger = getLogger()
const trojanLogger = getLogger('trojan')
logger.level = process.env.LOG_LEVEL || 'info'

export { logger, trojanLogger }
