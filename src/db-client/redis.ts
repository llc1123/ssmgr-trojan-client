import { Redis } from 'ioredis'
import { ECommand } from '../types'
import { DBClient } from './db'
import { logger } from '../logger'
import { ListResult, AddResult, RemoveResult, FlowResult } from './types'

/**
 * Redis table structure:
 *  HMSET key<SHA224 string> download bytes<number> upload bytes<number>
 *  SET user:acctId<number> key<SHA224 string>
 */
class RedisClient extends DBClient {
  private cl: Redis

  constructor(redisClient: Redis) {
    super()
    this.cl = redisClient
  }

  public listAccounts = async (): Promise<ListResult> => {
    try {
      const accounts = await this.cl.keys('user:*')
      let pipe = this.cl.pipeline()
      accounts.forEach((acct) => {
        pipe = pipe.get(acct)
      })
      const result = (await pipe.exec()).map((item, idx) => ({
        id: parseInt(accounts[idx].slice(5), 10),
        password: item[1] || '',
      }))
      logger.debug('List: ' + JSON.stringify(result))
      return { type: ECommand.List, data: result }
    } catch (e) {
      if (e instanceof Error) {
        throw new Error("Query error on 'list': " + e.message)
      }
      throw new Error("Query error on 'list': " + e)
    }
  }

  public addAccount = async (
    acctId: number,
    password: string,
  ): Promise<AddResult> => {
    const key = password
    try {
      if (await this.cl.exists(key)) {
        throw new Error('duplicate password.')
      }
      const currentKey = await this.cl.get('user:' + acctId.toString())
      if (currentKey) {
        await this.cl
          .multi()
          .eval(
            "local r = redis.call('hmget', KEYS[1], 'upload', 'download');" +
              "redis.call('hmset', KEYS[2], 'upload', r[1], 'download', r[2]);",
            2,
            currentKey,
            key,
          )
          .del(currentKey)
          .set('user:' + acctId.toString(), key)
          .exec()
      } else {
        await this.cl
          .multi()
          .set('user:' + acctId.toString(), key)
          .hmset(key, { download: '0', upload: '0' })
          .exec()
      }
      logger.debug(`Added user: ${acctId}`)
      return { type: ECommand.Add, id: acctId }
    } catch (e) {
      if (e instanceof Error) {
        throw new Error("Query error on 'add': " + e.message)
      }
      throw new Error("Query error on 'add': " + e)
    }
  }

  public removeAccount = async (acctId: number): Promise<RemoveResult> => {
    try {
      const currentKey = await this.cl.get('user:' + acctId.toString())
      if (currentKey) {
        await this.cl
          .multi()
          .del(currentKey)
          .del('user:' + acctId.toString())
          .exec()
      } else {
        await this.cl.del('user:' + acctId.toString())
      }
      logger.debug(`Removed user: ${acctId}`)
      return { type: ECommand.Delete, id: acctId }
    } catch (e) {
      if (e instanceof Error) {
        throw new Error("Query error on 'del': " + e.message)
      }
      throw new Error("Query error on 'del': " + e)
    }
  }

  public getFlow = async (): Promise<FlowResult> => {
    try {
      const accounts = await this.cl.keys('user:*')
      const result = (
        await Promise.all(
          accounts.map(async (user: string) => {
            const key = await this.cl.get(user)
            let flow = 0
            if (key) {
              const [dl, ul]: string[] = (
                await this.cl
                  .multi()
                  .hmget(key, 'download', 'upload')
                  .hmset(key, 'download', '0', 'upload', '0')
                  .exec()
              )[0][1]
              flow = parseInt(dl, 10) + parseInt(ul, 10)
            }
            return {
              id: parseInt(user.slice(5), 10),
              flow: flow,
            }
          }),
        )
      ).filter((user) => user.flow !== 0 && user.flow !== null)
      logger.debug('Flow: ' + JSON.stringify(result))
      return { type: ECommand.Flow, data: result }
    } catch (e) {
      if (e instanceof Error) {
        throw new Error("Query error on 'flow': " + e.message)
      }
      throw new Error("Query error on 'flow': " + e)
    }
  }

  public disconnect = (): void => {
    this.cl.disconnect()
  }
}

export { RedisClient }
