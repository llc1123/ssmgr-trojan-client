# ssmgr-trojan-client

> This is a fork of the original [ssmgr-trojan-client](https://github.com/llc1123/ssmgr-trojan-client).

![npm](https://img.shields.io/npm/v/@royli/ssmgr-trojan-client)
![npm](https://img.shields.io/npm/dt/@royli/ssmgr-trojan-client)
![dev-build](https://github.com/geekdada/ssmgr-trojan-client/workflows/dev-build/badge.svg?event=push)
![NPM](https://img.shields.io/npm/l/@royli/ssmgr-trojan-client)

A [shadowsocks-manager](https://github.com/shadowsocks/shadowsocks-manager) s-node for trojan-gfw. If you know how to use trojan and shadowsocks-manager, you know what this does.

**Support [trojan-gfw/trojan](https://github.com/trojan-gfw/trojan) only.**

## Prerequisites
- Node.js >= 14.0
- shadowsocks-manager >= 0.36.0

## Installation
```
npm -g i @royli/ssmgr-trojan-client
```

## Usage
```
Usage: ssmgr-trojan-client [options]

Options:
  -l, --listen-address <addr:port>  listening address for this client (default: 0.0.0.0:4001)
  -k, --key <password>              ssmgr client password
  --api <addr:port>                 trojan-go API address
  -d, --debug                       verbose output for debugging (default: false)
  -h, --help                        display help for command
```

## License

[MIT](./LICENSE)
