import { ECommand } from '../types'
import { Version } from '../version'

export interface ListResult {
  type: typeof ECommand.List
  data: {
    accountId: number
    password: string
  }[]
}

export interface AddResult {
  type: typeof ECommand.Add
  accountId: number
}

export interface RemoveResult {
  type: typeof ECommand.Delete
  accountId: number
}

export interface FlowResult {
  type: typeof ECommand.Flow
  data: {
    accountId: number
    flow: number
  }[]
}

export interface ChangePasswordResult {
  type: typeof ECommand.ChangePassword
  accountId: number
  password: string
}

export interface VersionResult {
  type: typeof ECommand.Version
  version: Version
}

export type DBClientResult =
  | ListResult
  | AddResult
  | RemoveResult
  | FlowResult
  | VersionResult
  | ChangePasswordResult
