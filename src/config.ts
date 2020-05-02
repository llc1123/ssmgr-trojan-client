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

  const key = program.key || Math.random().toString(36).substring(2, 15)

  if (!program.key) {
    logger.warn(`Password not specified. Using random password {${key}}`)
  }

  return {
    debug: program.debug ? true : false,
    addr: program.listenAddress?.split(':')[0] || '0.0.0.0',
    port: parseInt(program.listenAddress?.split(':')[1], 10) || 4001,
    key: key,
    dbType: (program.dbType as EDbType) || EDbType.Redis,
    dbAddr: program.dbAddress?.split(':')[0] || 'localhost',
    dbPort:
      parseInt(program.dbAddress?.split(':')[1], 10) ||
      program.dbType === EDbType.MySQL
        ? 3306
        : 6379,
    dbName: program.dbName || 'trojan',
    dbUser:
      program.dbUser || (program.dbType === EDbType.MySQL ? 'trojan' : ''),
    dbPassword: program.dbPassword || '',
  }
}

export { Config, parseConfig }
