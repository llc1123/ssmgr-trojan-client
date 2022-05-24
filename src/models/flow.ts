import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
  Association,
  NonAttribute,
} from 'sequelize'

import { getDatabase } from '../db'
import { Account } from './account'

const sequelize = getDatabase()

class Flow extends Model<InferAttributes<Flow>, InferCreationAttributes<Flow>> {
  // 'CreationOptional' is a special type that marks the field as optional
  // when creating an instance of the model (such as using Model.create()).
  declare id: CreationOptional<number>
  declare accountId: number
  declare flow: number

  declare account?: NonAttribute<Account>

  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>

  declare static associations: {
    account: Association<Flow, Account>
  }
}

Flow.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    flow: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'flows' },
)

export { Flow }
