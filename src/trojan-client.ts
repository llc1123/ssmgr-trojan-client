import { createHash } from 'crypto'
import { Redis } from 'ioredis'

interface TrojanClientResult {
  acctId?: number
  flow?: {
    acctId: number
    flow: number
  }[]
  version?: string
}

/**
 * Redis table structure:
 *  HMSET key<SHA224 string> download bytes<number> upload bytes<number>
 *  SET user:acctId<number> key<SHA224 string>
 */
class TrojanClient {
  private cl: Redis

  constructor(redisClient: Redis) {
    this.cl = redisClient
  }

  public addAccount = async (
    acctId: number,
    password: string,
  ): Promise<TrojanClientResult> => {
    try {
      let [dl, ul] = ['0', '0']
      const currentKey = await this.cl.get('user:' + acctId.toString())
      if (currentKey) {
        const [td, tu] = await this.cl.hmget(currentKey, 'download', 'upload')
        dl = td || '0'
        ul = tu || '0'
        await this.cl.del(currentKey)
      }
      const key = createHash('sha224').update(password, 'utf8').digest('hex')
      await this.cl.set('user:' + acctId.toString(), key)
      await this.cl.hmset(key, 'download', dl, 'upload', ul)
      return { acctId }
    } catch (e) {
      throw new Error("Query error on 'add': " + e.message)
    }
  }

  public removeAccount = async (
    acctId: number,
  ): Promise<TrojanClientResult> => {
    try {
      const currentKey = await this.cl.get('user:' + acctId.toString())
      if (currentKey) {
        await this.cl.del(currentKey)
      }
      await this.cl.del('user:' + acctId.toString())
      return { acctId }
    } catch (e) {
      throw new Error("Query error on 'del': " + e.message)
    }
  }

  public getFlow = async (): Promise<TrojanClientResult> => {
    interface AccountFlow {
      acctId: number
      flow: number
    }
    try {
      const result: AccountFlow[] = []
      const accounts = await this.cl.keys('user:*')
      await Promise.all(
        accounts
          .map((acctStr: string) => parseInt(acctStr.slice(5)))
          .map(async (acctId: number) => {
            const key = await this.cl.get('user:' + acctId)
            let flow = 0
            if (key) {
              const [dl, ul] = await this.cl.hmget(key, 'download', 'upload')
              flow = (dl ? parseInt(dl) || 0 : 0) + (ul ? parseInt(ul) || 0 : 0)
            }
            result.push({ acctId: acctId, flow: flow })
          }),
      )
      return { flow: result }
    } catch (e) {
      throw new Error("Query error on 'flow': " + e.message)
    }
  }
}

export { TrojanClient, TrojanClientResult }
