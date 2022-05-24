import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  NonAttribute,
  CreationOptional,
  Association,
} from 'sequelize'

import { getDatabase } from '../db'
import { Flow } from './flow'

const sequelize = getDatabase()

class Account extends Model<
  InferAttributes<Account>,
  InferCreationAttributes<Account>
> {
  declare id: number
  declare password: string

  declare flows?: NonAttribute<Flow[]>

  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>

  get accountId(): NonAttribute<number> {
    return this.id
  }

  declare static associations: {
    flows: Association<Account, Flow>
  }
}

Account.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: false,
      primaryKey: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'accounts' },
)

export { Account }
