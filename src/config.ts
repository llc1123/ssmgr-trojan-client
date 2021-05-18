import { program } from 'commander'
import { Config } from './types'
import { logger } from './logger'
import { EDbType } from './db-client/types'

const parseConfig = (): Config => {
  program
    .option(
      '-d, --debug',
      'verbose output for debug infomation (default: false)',
    )
    .option(
      '-l, --listen-address <addr:port>',
      'listening address for manager (default: 0.0.0.0:4001)',
    )
    .option('-k, --key <password>', 'ssmgr client password')
    .option('--db-type <type>', 'database type (redis/mysql) (default: redis)')
    .option(
      '--db-address <addr:port>',
      'database address (default: localhost:6379(redis)/localhost:3306(mysql))',
    )
    .option(
      '--db-name <database>',
      '(mysql only) database name (default: trojan)',
    )
    .option(
      '--db-user <username>',
      '(mysql only) database username (defualt: trojan)',
    )
    .option('--db-password <password>', 'database password (default: none)')
    .parse(process.argv)

  const options = program.opts()

  const key = options.key || Math.random().toString(36).substring(2, 15)

  if (!options.key) {
    logger.warn(`Password not specified. Using random password {${key}}`)
  }

  return {
    debug: options.debug ? true : false,
    addr: options.listenAddress?.split(':')[0] || '0.0.0.0',
    port: parseInt(options.listenAddress?.split(':')[1], 10) || 4001,
    key: key,
    dbType: (options.dbType as EDbType) || EDbType.Redis,
    dbAddr: options.dbAddress?.split(':')[0] || 'localhost',
    dbPort:
      parseInt(options.dbAddress?.split(':')[1], 10) ||
      (options.dbType === EDbType.MySQL ? 3306 : 6379),
    dbName: options.dbName || 'trojan',
    dbUser:
      options.dbUser || (options.dbType === EDbType.MySQL ? 'trojan' : ''),
    dbPassword: options.dbPassword || '',
  }
}

export { Config, parseConfig }
