import { createHash } from 'crypto'

import { logger } from '../logger'
import { ParsedResult } from '../types.js'

interface PackData {
  code: number
  data?: ParsedResult
}

export const pack = (data: PackData): Buffer => {
  const message = JSON.stringify(data)
  const dataBuffer = Buffer.from(message)
  const length = dataBuffer.length
  const lengthBuffer = Buffer.from(length.toString(16).padStart(8, '0'), 'hex')

  return Buffer.concat([lengthBuffer, dataBuffer])
}

export const checkCode = (key: string, data: Buffer, code: Buffer): boolean => {
  const time = Number.parseInt(data.slice(0, 6).toString('hex'), 16)
  if (Math.abs(Date.now() - time) > 10 * 60 * 1000) {
    logger.warn('Invalid message: Timed out.')
    return false
  }
  const command = data.slice(6).toString()
  const hash = createHash('md5')
    .update(time + command + key)
    .digest('hex')
    .substr(0, 8)

  if (hash === code.toString('hex')) {
    return true
  } else {
    logger.warn('Invalid message: Hash mismatch. (Incorrect password)')
    return false
  }
}
