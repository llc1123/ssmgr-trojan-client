import { Account } from './account'
import { Flow } from './flow'

Account.hasMany(Flow, {
  sourceKey: 'id',
  foreignKey: 'accountId',
  as: 'flows',
})

Flow.belongsTo(Account, {
  as: 'account',
})

export { Account, Flow }
