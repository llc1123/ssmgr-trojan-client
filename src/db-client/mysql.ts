import { ECommand } from '../types'
import { DBClient } from './db'
import { logger } from '../logger'
import { Connection } from 'promise-mysql'
import { ListResult, AddResult, RemoveResult, FlowResult } from './types'

interface OkPacket {
  fieldCount: number
  affectedRows: number
  insertId: number
  serverStatus: number
  warningCount: number
  message: string
  protocol41: boolean
  changedRows: number
}

/**
 * MySQL table structure (minimal table required by trojan-gfw):
 *   CREATE TABLE users (
 *     id INT UNSIGNED NOT NULL,                     <- acctId
 *     password CHAR(56) NOT NULL UNIQUE,            <- key
 *     quota BIGINT NOT NULL DEFAULT -1,
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

  public listAccounts = async (): Promise<ListResult> => {
    try {
      const accts: {
        id: number
        password: string
      }[] = await this.cl.query('SELECT `id`, `password` FROM `users`')
      return { type: ECommand.List, data: accts }
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
    try {
      const key = password
      const dup: { id: number }[] = await this.cl.query(
        'SELECT `id` FROM `users` WHERE `password` = ?',
        key,
      )
      if (dup.length !== 0) {
        throw new Error('duplicate password.')
      } else {
        await this.cl.query(
          'INSERT INTO `users` (`id`, `password`, `quota`, `download`, `upload`) \
           VALUES(?, ?, -1, 0, 0) ON DUPLICATE KEY UPDATE `password` = ?',
          [acctId, key, key],
        )
        return { type: ECommand.Add, id: acctId }
      }
    } catch (e) {
      if (e instanceof Error) {
        throw new Error("Query error on 'add': " + e.message)
      }
      throw new Error("Query error on 'add': " + e)
    }
  }

  public removeAccount = async (acctId: number): Promise<RemoveResult> => {
    try {
      const result: OkPacket = await this.cl.query(
        'DELETE FROM `users` WHERE `id`= ?',
        [acctId],
      )
      if (result.affectedRows === 1) {
        logger.debug(`Removed user: ${acctId}`)
        return { type: ECommand.Delete, id: acctId }
      } else {
        throw new Error(`user id ${acctId} does not exist.`)
      }
    } catch (e) {
      if (e instanceof Error) {
        throw new Error("Query error on 'del': " + e.message)
      }
      throw new Error("Query error on 'del': " + e)
    }
  }

  public getFlow = async (): Promise<FlowResult> => {
    interface UserUlDl {
      id: number
      upload: number
      download: number
    }

    try {
      const result: UserUlDl[] = await this.cl.query(
        'SELECT `id`, `upload`, `download` FROM `users` WHERE upload > 0 OR download > 0',
      )
      await Promise.all(
        result.map((userUlDl: UserUlDl): void => {
          this.cl.query(
            'UPDATE `users` SET `upload` = `upload` - ?, `download` = `download` - ? WHERE `id` = ?',
            [userUlDl.upload, userUlDl.download, userUlDl.id],
          )
        }),
      )
      logger.debug(`Flow: ${JSON.stringify(result)}`)
      return {
        type: ECommand.Flow,
        data: result.map((userFlow: UserUlDl) => ({
          id: userFlow.id,
          flow: userFlow.upload + userFlow.download,
        })),
      }
    } catch (e) {
      if (e instanceof Error) {
        throw new Error("Query error on 'flow': " + e.message)
      }
      throw new Error("Query error on 'flow': " + e)
    }
  }

  public disconnect = (): void => {
    this.cl.destroy()
  }
}

export { MySQLClient }
