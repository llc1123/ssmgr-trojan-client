import * as Sentry from '@sentry/node'
import { logger } from './logger'
import { hostname } from 'os'

const dsn = process.env.SENTRY_DSN
const tracesSampleRate = process.env.SENTRY_TRACES_SAMPLE_RATE
  ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
  : 1
let enabled = false

Sentry.setTags({
  hostname: hostname(),
})

if (dsn) {
  logger.info(`Sentry is enabled`)
  Sentry.init({
    dsn,
    tracesSampleRate,
  })
  enabled = true
}

export default Sentry
export { enabled }
