# ssmgr-trojan-client

> This is a fork of the original [ssmgr-trojan-client](https://github.com/llc1123/ssmgr-trojan-client).

[![npm](https://img.shields.io/npm/v/@royli/ssmgr-trojan-client)][npm-url]
[![npm](https://img.shields.io/npm/dt/@royli/ssmgr-trojan-client)][npm-url]
![dev-build](https://github.com/geekdada/ssmgr-trojan-client/workflows/dev-build/badge.svg?event=push)
![NPM](https://img.shields.io/npm/l/@royli/ssmgr-trojan-client)

[npm-url]: https://www.npmjs.com/package/@royli/ssmgr-trojan-client

A [shadowsocks-manager](https://github.com/shadowsocks/shadowsocks-manager) s-node for trojan-gfw. If you know how to use trojan and shadowsocks-manager, you know what this does.

**Support [trojan-gfw/trojan](https://github.com/trojan-gfw/trojan) only.**

## Prerequisites
- Node.js >= 16.0
- shadowsocks-manager >= 0.36.0
- trojan-go v0.10.6 tested

## Installation
```
npm -g i @royli/ssmgr-trojan-client
```

## Usage
```
Usage: ssmgr-trojan-client [options]

Options:
  -l, --listen-address <addr:port>  listening address for this client (default: 0.0.0.0:4001) (default: "0.0.0.0:4001")
  -k, --key <password>              ssmgr client password
  --api <addr:port>                 trojan-go API address
  --trojan-config <path>            trojan-go config file path
  -d, --debug                       verbose output for debugging (default: false)
  -h, --help                        display help for command
```

## Examples

### Run the client in standalone mode
```bash
ssmgr-trojan-client -l <addr:port> -k <password> --api <addr:port>
```

You need to run trojan-go separately in this mode.

### Run the client with a builtin trojan-go instance
```bash
ssmgr-trojan-client -l <addr:port> -k <password> --trojan-config <path>
```

A builtin trojan-go instance (latest version) will be started automatically using the configuration provided (please make sure the API feature is enabled).

## License

[MIT](./LICENSE)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fgeekdada%2Fssmgr-trojan-client.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fgeekdada%2Fssmgr-trojan-client?ref=badge_large)
