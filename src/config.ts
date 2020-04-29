import { program } from 'commander'
import { Config, EDbType } from './types'
import { logger } from './logger'

const parseConfig = (): Config => {
  program
    .option(
      '-d, --debug',
      'default: false  verbose output for debug infomation',
    )
    .option(
      '-l, --listen-address <addr:port>',
      'default: 0.0.0.0:4001  listening address for manager',
      '0.0.0.0:4001',
    )
    .option('-k, --key <password>', 'ssmgr client password', '')
    .option(
      '--db-type <type>',
      'default: redis  database type (redis/mysql)',
      'redis',
    )
    .option(
      '--db-address <addr:port>',
      'default: localhost:6379(redis)/localhost:3306(mysql)  database address',
      'localhost',
    )
    .option(
      '--db-user <username>',
      'defualt: none(redis)/trojan(mysql)  database username',
      '',
    )
    .option('--db-password <password>', 'default: none  database password', '')
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
    dbUser: program.dbUser || program.dbType === EDbType.MySQL ? 'trojan' : '',
    dbPassword: program.dbPassword || '',
  }
}

export { Config, parseConfig }
