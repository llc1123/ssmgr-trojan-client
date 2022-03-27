import Sentry from './sentry'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const version = require('../package.json').version

Sentry.setContext('clientVersion', version)

export type Version = typeof version
export { version }
