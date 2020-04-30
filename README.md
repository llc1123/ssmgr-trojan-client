# ssmgr-trojan-client

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
