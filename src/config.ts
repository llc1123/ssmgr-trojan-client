import { program } from 'commander'
import yaml from 'yaml'
import fs from 'fs-extra'
import path from 'path'

import { Config } from './types'

const parseConfig = (): Config => {
  const options = program.opts()

  program
    .option(
      '-l, --listen-address [addr:port]',
      'listening address for this client',
      '0.0.0.0:4001',
    )
    .requiredOption('-k, --key <password>', 'ssmgr client password')
    .option('--api <addr:port>', 'trojan-go API address')
    .option('--trojan-config <path>', 'trojan-go config file path')
    .option(
      '--fake-website [addr:port]',
      'run a fake website on address [addr:port], default to "127.0.0.1:4002" if not specified',
    )
    .option('-d, --debug', 'verbose output for debugging (default: false)')
    .parse(process.argv)

  if (!options.api && !options.trojanConfig) {
    throw new Error(
      'trojan-go API address or trojan-go config file path is required',
    )
  } else if (options.api && options.trojanConfig) {
    throw new Error(
      'trojan-go API address and trojan-go config file path are mutually exclusive',
    )
  }

  if (!options.api && options.trojanConfig) {
    let trojanConfig: any
    let isJSON = false

    if (options.trojanConfig.endsWith('yaml')) {
      trojanConfig = yaml.parse(
        fs.readFileSync(
          path.resolve(process.cwd(), options.trojanConfig),
          'utf8',
        ),
      )
    } else {
      trojanConfig = fs.readJSONSync(
        path.resolve(process.cwd(), options.trojanConfig),
      )
      isJSON = true
    }

    if (
      isJSON &&
      trojanConfig?.api?.['api_addr'] &&
      trojanConfig?.api?.['api_port']
    ) {
      options.api = `${trojanConfig.api['api_addr']}:${trojanConfig.api['api_port']}`
    } else if (
      !isJSON &&
      trojanConfig?.api?.['api-addr'] &&
      trojanConfig?.api?.['api-port']
    ) {
      options.api = `${trojanConfig.api['api-addr']}:${trojanConfig.api['api-port']}`
    } else {
      throw new Error('trojan-go config file must have the API feature enabled')
    }
  }

  if (options.fakeWebsite === true) {
    options.fakeWebsite = '127.0.0.1:4002'
  }

  return {
    debug: !!options.debug,
    addr: options.listenAddress?.split(':')[0] || '0.0.0.0',
    port: parseInt(options.listenAddress?.split(':')[1], 10) || 4001,
    key: options.key as string,
    apiHost: options.api?.split(':')[0] || 'localhost',
    apiPort: parseInt(options.api?.split(':')[1], 10),
    trojanConfig: options.trojanConfig as string | undefined,
    fakeWebsite: options.fakeWebsite as string | undefined,
  }
}

const getConfig = (() => {
  let config: Config | undefined

  return (): Config => {
    if (!config) {
      config = parseConfig()
    }

    return config
  }
})()

export { Config, parseConfig, getConfig }
