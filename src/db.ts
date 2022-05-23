import { Sequelize } from 'sequelize'
import { join } from 'path'

import { getConfig } from './config'
import { logger } from './logger'

const file = join(process.cwd(), 'db.sqlite')

export const getDatabase = (() => {
  let database: Sequelize

  return () => {
    const config = getConfig()

    if (!database) {
      database = new Sequelize({
        dialect: 'sqlite',
        storage: file,
        logging: config.debug ? logger.info.bind(logger) : false,
      })
    }
    return database
  }
})()
