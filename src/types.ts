import { Socket } from 'net'

export enum ECommand {
  List = 'list',
  Add = 'add',
  Delete = 'del',
  Flow = 'flow',
  Version = 'version',
}

export interface UserId {
  port: number
}

export interface UserIdPwd {
  port: number
  password: string
}

export interface UserFlow {
  port: number
  flow: number
}

export interface UserData {
  acctId: number
  data: string
}

export type ParsedResult = string | UserId | UserFlow[] | UserIdPwd[]

export interface DBClientResult {
  type: ECommand
  data: number | UserData[] | string
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
