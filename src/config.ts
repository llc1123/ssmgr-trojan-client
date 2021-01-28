import { program } from 'commander'
import { Config } from './types'
import { logger } from './logger'
import { EDbType } from './db-client/types'

const parseConfig = (): Config => {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const cli: any = program
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

  const key = cli.key || Math.random().toString(36).substring(2, 15)

  if (!cli.key) {
    logger.warn(`Password not specified. Using random password {${key}}`)
  }

  return {
    debug: cli.debug ? true : false,
    addr: cli.listenAddress?.split(':')[0] || '0.0.0.0',
    port: parseInt(cli.listenAddress?.split(':')[1], 10) || 4001,
    key: key,
    dbType: (cli.dbType as EDbType) || EDbType.Redis,
    dbAddr: cli.dbAddress?.split(':')[0] || 'localhost',
    dbPort:
      parseInt(cli.dbAddress?.split(':')[1], 10) ||
      (cli.dbType === EDbType.MySQL ? 3306 : 6379),
    dbName: cli.dbName || 'trojan',
    dbUser: cli.dbUser || (cli.dbType === EDbType.MySQL ? 'trojan' : ''),
    dbPassword: cli.dbPassword || '',
  }
}

export { Config, parseConfig }
