# ssmgr-trojan-client

![npm](https://img.shields.io/npm/v/ssmgr-trojan-client)
![npm bundle size](https://img.shields.io/bundlephobia/min/ssmgr-trojan-client)
![npm](https://img.shields.io/npm/dt/ssmgr-trojan-client)
![dev-build](https://github.com/llc1123/ssmgr-trojan-client/workflows/dev-build/badge.svg?event=push)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/4e94a5c64493490b95696e9b69d14c50)](https://app.codacy.com/manual/llc1123/ssmgr-trojan-client?utm_source=github.com&utm_medium=referral&utm_content=llc1123/ssmgr-trojan-client&utm_campaign=Badge_Grade_Dashboard)
![NPM](https://img.shields.io/npm/l/ssmgr-trojan-client)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fllc1123%2Fssmgr-trojan-client.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fllc1123%2Fssmgr-trojan-client?ref=badge_shield)

A [shadowsocks-manager](https://github.com/shadowsocks/shadowsocks-manager) s-node for trojan-gfw. If you know how to use trojan and shadowsocks-manager, you know what this does.

Support multiple variants of trojan. Including [p4gefau1t/trojan-go](https://github.com/p4gefau1t/trojan-go), [trojan-gfw/trojan](https://github.com/trojan-gfw/trojan), [DenrianWeiss/trojan-cluster](https://github.com/DenrianWeiss/trojan-cluster) and others.

## Prerequisites
- Trojan with MySQL or Redis support
- Node.js >= 12.0
- shadowsocks-manager >= 0.36.0

## Installation
```
npm -g i ssmgr-trojan-client
```

## Usage
```
Usage: ssmgr-trojan-client [options]

Options:
  -d, --debug                       verbose output for debug infomation (default: false)
  -l, --listen-address <addr:port>  listening address for manager (default: 0.0.0.0:4001)
  -k, --key <password>              ssmgr client password
  --db-type <type>                  database type (redis/mysql) (default: redis)
  --db-address <addr:port>          database address (default: localhost:6379(redis)/localhost:3306(mysql))
  --db-name <database>              (mysql only) database name (default: trojan)
  --db-user <username>              (mysql only) database username (defualt: trojan)
  --db-password <password>          database password (default: none)
  -h, --help                        display help for command
```


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fllc1123%2Fssmgr-trojan-client.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fllc1123%2Fssmgr-trojan-client?ref=badge_large)
