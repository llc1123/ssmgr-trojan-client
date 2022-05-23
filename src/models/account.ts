import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
} from 'sequelize'

import { getDatabase } from '../db'

const sequelize = getDatabase()

export class Account extends Model<
  InferAttributes<Account>,
  InferCreationAttributes<Account>
> {
  // 'CreationOptional' is a special type that marks the field as optional
  // when creating an instance of the model (such as using Model.create()).
  declare id: CreationOptional<number>
  declare accountId: number
  declare password: string
}

Account.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
    },
    accountId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { sequelize, tableName: 'accounts' },
)
