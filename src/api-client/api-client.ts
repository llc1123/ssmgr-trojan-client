import { Op } from 'sequelize'
import { Account, Flow } from '../models'
import { ECommand } from '../types'
import {
  AddResult,
  ChangePasswordResult,
  FlowResult,
  ListResult,
  RemoveResult,
} from './types'
import { TrojanManager } from './trojan-manager'

interface APIClientProps {
  host: string
  port: number
}

export class APIClient {
  private readonly trojanManager: TrojanManager

  constructor({ host, port }: APIClientProps) {
    this.trojanManager = new TrojanManager({ host, port })
  }

  public async init({
    onTickError,
  }: {
    onTickError: (error: Error) => void
  }): Promise<void> {
    await this.onTick()

    setInterval(() => {
      this.onTick().catch((err) => {
        if (err instanceof Error) {
          try {
            onTickError(err)
          } catch (_) {
            // ignore
          }
        }
      })
    }, 60 * 1000)
  }

  public async listAccounts(): Promise<ListResult> {
    const accounts = await Account.findAll()

    return { type: ECommand.List, data: accounts }
  }

  public async addAccount(
    accountId: number,
    passwordHash: string,
  ): Promise<AddResult> {
    await Account.findOrCreate({
      where: { id: accountId },
      defaults: { id: accountId, password: passwordHash },
    })

    return { type: ECommand.Add, accountId }
  }

  public async removeAccount(accountId: number): Promise<RemoveResult> {
    await Account.destroy({
      where: {
        id: accountId,
      },
    })

    return { type: ECommand.Delete, accountId }
  }

  public async changePassword(
    accountId: number,
    passwordHash: string,
  ): Promise<ChangePasswordResult> {
    await this.removeAccount(accountId)
    await this.addAccount(accountId, passwordHash)

    return {
      type: ECommand.ChangePassword,
      accountId,
      password: passwordHash,
    }
  }

  public async getFlow(
    options: { clear?: boolean; startTime?: number; endTime?: number } = {},
  ): Promise<FlowResult> {
    const startTime = options.startTime || 0
    const endTime = options.endTime || Date.now()
    const accountFlows = await Account.findAll({
      include: [
        {
          association: Account.associations.flows,
          where: {
            createdAt: {
              [Op.between]: [startTime, endTime],
            },
          },
        },
      ],
    })
    const results = accountFlows.map((account) => {
      const flows = account.flows
      let flow = 0

      if (flows) {
        flows.forEach((f) => {
          flow += f.flow
        })
      }

      return {
        accountId: account.id,
        flow,
      }
    })

    if (options.clear) {
      await Flow.destroy({
        where: {
          createdAt: {
            [Op.between]: [startTime, endTime],
          },
        },
      })
    }

    return { type: ECommand.Flow, data: results }
  }

  public disconnect(): void {
    this.trojanManager.disconnect()
  }

  private async onTick(): Promise<void> {
    const [accounts, accountFlows, existingPasswords] = await Promise.all([
      Account.findAll(),
      this.trojanManager.getFlow(),
      this.trojanManager.listAccounts(),
    ])
    const passwordsToAdd = []
    const flowsToAdd = []

    for await (const account of accounts) {
      const { password } = account
      const existingPasswordIndex = existingPasswords.findIndex(
        (existingPassword: string) => existingPassword === password,
      )
      const flows = accountFlows
        .filter((flow) => flow.passwordHash === account.password)
        .map((flow) => ({
          accountId: account.id,
          flow: flow.flow,
        }))

      flowsToAdd.push(...flows)

      if (existingPasswordIndex > -1) {
        existingPasswords.splice(existingPasswordIndex, 1)
      } else {
        passwordsToAdd.push(password)
      }
    }

    const jobs = []

    jobs.push(Flow.bulkCreate(flowsToAdd))
    jobs.push(
      this.trojanManager.clearFlow(
        accountFlows.map((flow) => flow.passwordHash),
      ),
    )

    if (passwordsToAdd.length) {
      jobs.push(this.trojanManager.addAccount(passwordsToAdd))
    }

    if (existingPasswords.length) {
      jobs.push(this.trojanManager.removeAccount(existingPasswords))
    }

    await Promise.all(jobs)
  }
}
