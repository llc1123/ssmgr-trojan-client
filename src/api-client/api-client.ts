import { Account } from '../models'
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
          onTickError(err)
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
      where: { accountId },
      defaults: { accountId, password: passwordHash },
    })

    return { type: ECommand.Add, accountId }
  }

  public async removeAccount(accountId: number): Promise<RemoveResult> {
    await Account.destroy({
      where: {
        accountId,
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

  public async getFlow(options: { clear?: boolean } = {}): Promise<FlowResult> {
    const accountFlows = await this.trojanManager.getFlow(options)
    const results = []

    for await (const flow of accountFlows) {
      const account = await Account.findOne({
        where: {
          password: flow.passwordHash,
        },
      })

      if (account) {
        results.push({
          accountId: account.accountId,
          flow: flow.flow,
        })
      }
    }

    return { type: ECommand.Flow, data: results }
  }

  public disconnect(): void {
    this.trojanManager.disconnect()
  }

  private async onTick(): Promise<void> {
    const [accounts, existingPasswords] = await Promise.all([
      Account.findAll(),
      this.trojanManager.listAccounts(),
    ])

    for await (const account of accounts) {
      const { password } = account
      const existingPasswordIndex = existingPasswords.findIndex(
        (existingPassword: string) => existingPassword === password,
      )

      if (existingPasswordIndex > -1) {
        existingPasswords.splice(existingPasswordIndex, 1)
      } else {
        await this.trojanManager.addAccount(password)
      }
    }

    for await (const password of existingPasswords) {
      await this.trojanManager.removeAccount(password)
    }
  }
}
