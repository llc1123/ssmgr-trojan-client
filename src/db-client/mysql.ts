import { createHash } from 'crypto'
import { DBClientResult } from '../types'
import { DBClient } from './db'
import { logger } from '../logger'
import { Connection } from 'promise-mysql'

/**
 * MySQL table structure (minimal table required by trojan-gfw):
 *   CREATE TABLE users (
 *     id INT UNSIGNED NOT NULL,                     <- acctId
 *     password CHAR(56) NOT NULL UNIQUE,            <- key
 *     quota BIGINT NOT NULL DEFAULT 0,
 *     download BIGINT UNSIGNED NOT NULL DEFAULT 0,  <- download
 *     upload BIGINT UNSIGNED NOT NULL DEFAULT 0,    <- upload
 *     PRIMARY KEY (id),
 *     INDEX (password)
 *   );
 */
class MySQLClient extends DBClient {
  private cl: Connection

  constructor(mysqlClient: Connection) {
    super()
    this.cl = mysqlClient
  }

  public addAccount = async (
    acctId: number,
    password: string,
  ): Promise<DBClientResult> => {
    try {
    } catch (e) {
      throw new Error("Query error on 'del': " + e.message)
    }
  }

  public removeAccount = async (acctId: number): Promise<DBClientResult> => {
    try {
      const result = await this.cl.query('DELETE FROM "users" WHERE "id"= ?', [
        acctId,
      ])
      if (result) {
        logger.debug(`Removed user: ${acctId}`)
        return { acctId }
      } else {
        throw new Error(`user id ${acctId} does not exist.`)
      }
    } catch (e) {
      throw new Error("Query error on 'del': " + e.message)
    }
  }

  public getFlow = async (): Promise<DBClientResult> => {}

  public disconnect = (): void => {
    this.cl.destroy()
  }
}

export { MySQLClient }
