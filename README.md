# ssmgr-trojan-client

```
Usage: ssmgr-trojan-client [options]

Options:
  -d, --debug                       default: false  verbose output for debug infomation
  -l, --listen-address <addr:port>  default: 0.0.0.0:4001  listening address for manager (default: "0.0.0.0:4001")
  -k, --key <password>              ssmgr client password (default: "")
  --db-type <type>                  default: redis  database type (redis/mysql) (default: "redis")
  --db-address <addr:port>          default: localhost:6379(redis)/localhost:3306(mysql)  database address (default: "localhost")
  --db-name <database>              default: trojan  database name (default: "trojan")
  --db-user <username>              defualt: none(redis)/trojan(mysql)  database username (default: "")
  --db-password <password>          default: none  database password (default: "")
  -h, --help                        display help for command
```
