import * as Sentry from '@sentry/node'

const dsn = process.env.SENTRY_DSN
const tracesSampleRate = process.env.SENTRY_TRACES_SAMPLE_RATE
  ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
  : 1
let enabled = false

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate,
  })
  enabled = true
}

export default Sentry
export { enabled }
