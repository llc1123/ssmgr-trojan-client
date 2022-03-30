import Sentry from './sentry'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const version = require('../package.json').version

Sentry.setTag('client_version', version)

export type Version = typeof version
export { version }
