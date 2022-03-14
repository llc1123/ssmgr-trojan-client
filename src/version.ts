// eslint-disable-next-line @typescript-eslint/no-var-requires
const version = require('../package.json').version

export type Version = typeof version
export { version }
