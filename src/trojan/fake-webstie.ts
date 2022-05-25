import execa from 'execa'
import { join } from 'path'

import { logger } from '../logger'

export const startFakeWebsite = (bindAddress: string) => {
  const script = join(__dirname, '../../fake-website/server.mjs')

  const fakeWebsiteProcess = execa.node(script, [bindAddress], {
    stdio: 'ignore',
  })

  fakeWebsiteProcess.on('error', (error: Error) => {
    logger.error(error.message)
    fakeWebsiteProcess.kill(1)
  })

  return fakeWebsiteProcess
}
