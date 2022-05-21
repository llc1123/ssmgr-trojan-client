import { program } from 'commander'
import { Config } from './types'

const parseConfig = (): Config => {
  const options = program.opts()

  program
    .option(
      '-l, --listen-address <addr:port>',
      'listening address for this client (default: 0.0.0.0:4001)',
      '0.0.0.0:4001',
    )
    .requiredOption('-k, --key <password>', 'ssmgr client password')
    .requiredOption('--api <addr:port>', 'trojan-go API address')
    .option('-d, --debug', 'verbose output for debugging (default: false)')
    .parse(process.argv)

  return {
    debug: !!options.debug,
    addr: options.listenAddress?.split(':')[0] || '0.0.0.0',
    port: parseInt(options.listenAddress?.split(':')[1], 10) || 4001,
    key: options.key,
    apiHost: options.api?.split(':')[0] || 'localhost',
    apiPort: parseInt(options.api?.split(':')[1], 10),
  }
}

export { Config, parseConfig }
