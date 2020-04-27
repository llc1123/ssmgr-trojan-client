import { DBClientResult } from '../app'

/**
 * Database Client Abstract Class
 */
abstract class DBClient {
  public abstract addAccount(
    acctId: number,
    password: string,
  ): Promise<DBClientResult>

  public abstract removeAccount(acctId: number): Promise<DBClientResult>

  public abstract getFlow(): Promise<DBClientResult>
}

export { DBClient }
