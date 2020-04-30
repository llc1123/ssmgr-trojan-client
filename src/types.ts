import { Socket } from 'net'

export interface DBClientResult {
  acctId?: number
  flow?: {
    acctId: number
    flow: number
  }[]
  version?: string
}

export interface ReceiveData {
  data: Buffer
  socket: Socket
}

export enum EDbType {
  Redis = 'redis',
  MySQL = 'mysql',
}

export interface Config {
  debug: boolean
  addr: string
  port: number
  key: string
  dbType: EDbType
  dbAddr: string
  dbPort: number
  dbName: string
  dbUser: string
  dbPassword: string
}
