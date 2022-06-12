import { ECommand } from '../types'

export enum EDbType {
  Redis = 'redis',
  MySQL = 'mysql',
}

export interface ListResult {
  type: typeof ECommand.List
  data: {
    id: number
    password: string
  }[]
}

export interface AddResult {
  type: typeof ECommand.Add
  id: number
}

export interface RemoveResult {
  type: typeof ECommand.Delete
  id: number
}

export interface FlowResult {
  type: typeof ECommand.Flow
  data: {
    id: number
    flow: number
  }[]
}

export interface VersionResult {
  type: typeof ECommand.Version
  version: string
}

export type DBClientResult =
  | ListResult
  | AddResult
  | RemoveResult
  | FlowResult
  | VersionResult
