import { Socket } from 'net'
import { Version } from './version'

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
  sumFlow: number
}

export interface ParsedVersion {
  version: Version
}

export type ParsedResult = UserId | UserIdPwd[] | UserFlow[] | ParsedVersion

export interface ReceiveData {
  data: Buffer
  socket: Socket
}

export interface Config {
  debug: boolean
  addr: string
  port: number
  key: string
  apiHost: string
  apiPort: number
}
