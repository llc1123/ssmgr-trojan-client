import { createHash } from 'crypto'
import { Redis } from 'ioredis'
import { DBClientResult, ECommand, UserData } from '../types'
import { DBClient } from './db'
import { logger } from '../logger'

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

  public listAccounts = async (): Promise<DBClientResult> => {
    try {
      const accounts = await this.cl.keys('user:*')
      const result = await Promise.all(
        accounts.map(
          async (user: string): Promise<UserData> => ({
            acctId: parseInt(user.slice(5), 10),
            data: (await this.cl.get(user)) || '',
          }),
        ),
      )
      return { type: ECommand.List, data: result }
    } catch (e) {
      throw new Error("Query error on 'list': " + e.message)
    }
  }

  public addAccount = async (
    acctId: number,
    password: string,
  ): Promise<DBClientResult> => {
    const key = createHash('sha224')
      .update(`${acctId.toString()}:${password}`, 'utf8')
      .digest('hex')
    let [dl, ul] = ['0', '0']
    try {
      if (await this.cl.exists(key)) {
        throw new Error('duplicate password.')
      }
      const currentKey = await this.cl.get('user:' + acctId.toString())
      if (currentKey) {
        const [td, tu] = await this.cl.hmget(currentKey, 'download', 'upload')
        dl = td || '0'
        ul = tu || '0'
        await this.cl.del(currentKey)
      }
      await this.cl.set('user:' + acctId.toString(), key)
      await this.cl.hmset(key, { download: dl, upload: ul })
      logger.debug(`Added user: ${acctId}`)
      return { type: ECommand.Add, data: acctId }
    } catch (e) {
      throw new Error("Query error on 'add': " + e.message)
    }
  }

  public removeAccount = async (acctId: number): Promise<DBClientResult> => {
    try {
      const currentKey = await this.cl.get('user:' + acctId.toString())
      if (currentKey) {
        await this.cl.del(currentKey)
      }
      await this.cl.del('user:' + acctId.toString())
      logger.debug(`Removed user: ${acctId}`)
      return { type: ECommand.Delete, data: acctId }
    } catch (e) {
      throw new Error("Query error on 'del': " + e.message)
    }
  }

  public getFlow = async (): Promise<DBClientResult> => {
    try {
      const accounts = await this.cl.keys('user:*')
      const result = await Promise.all(
        accounts.map(
          async (user: string): Promise<UserData> => {
            const key = await this.cl.get(user)
            let flow = 0
            if (key) {
              const [dl, ul] = await this.cl.hmget(key, 'download', 'upload')
              await this.cl.hincrby(key, 'download', -parseInt(dl || '0', 10))
              await this.cl.hincrby(key, 'upload', -parseInt(ul || '0', 10))
              flow =
                (dl ? parseInt(dl, 10) || 0 : 0) +
                (ul ? parseInt(ul, 10) || 0 : 0)
            }
            return {
              acctId: parseInt(user.slice(5), 10),
              data: flow.toString(),
            }
          },
        ),
      )
      logger.debug('Flow: ' + JSON.stringify(result))
      return { type: ECommand.Flow, data: result }
    } catch (e) {
      throw new Error("Query error on 'flow': " + e.message)
    }
  }

  public disconnect = (): void => {
    this.cl.disconnect()
  }
}

export { RedisClient }
