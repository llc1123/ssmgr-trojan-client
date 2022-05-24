import { ChannelCredentials } from '@grpc/grpc-js'
import { GrpcTransport } from '@protobuf-ts/grpc-transport'

import { SetUsersRequest_Operation } from '../protobuf/api'
import { TrojanServerServiceClient } from '../protobuf/api.client'

interface TrojanManagerProps {
  host: string
  port: number
}

export class TrojanManager {
  private cl: TrojanServerServiceClient
  private readonly transport: GrpcTransport

  constructor({ host, port }: TrojanManagerProps) {
    this.transport = new GrpcTransport({
      host: `${host}:${port}`,
      channelCredentials: ChannelCredentials.createInsecure(),
      'grpc.max_receive_message_length': 20 * 1024 * 1024,
      'grpc.max_send_message_length': 20 * 1024 * 1024,
    })
    this.cl = new TrojanServerServiceClient(this.transport)
  }

  public async listAccounts(): Promise<string[]> {
    const streamingCall = this.cl.listUsers({})
    const accounts = []

    for await (const user of streamingCall.responses) {
      const { status } = user
      const hash = status?.user?.hash

      if (!hash) continue

      accounts.push(hash)
    }

    return accounts
  }

  public async addAccount(passwordHashList: string[]): Promise<void> {
    const duplexCall = this.cl.setUsers()

    for await (const passwordHash of passwordHashList) {
      await duplexCall.requests.send({
        operation: SetUsersRequest_Operation.Add,
        status: {
          ipLimit: 0,
          ipCurrent: 0,
          user: {
            hash: passwordHash,
            password: '',
          },
        },
      })
    }

    await duplexCall.requests.complete()

    await duplexCall.status
  }

  public async removeAccount(passwordHashList: string[]): Promise<void> {
    const duplexCall = this.cl.setUsers()

    for await (const passwordHash of passwordHashList) {
      await duplexCall.requests.send({
        operation: SetUsersRequest_Operation.Delete,
        status: {
          ipLimit: 0,
          ipCurrent: 0,
          user: {
            hash: passwordHash,
            password: '',
          },
        },
      })
    }

    await duplexCall.requests.complete()

    await duplexCall.status
  }

  public async getFlow(): Promise<
    Array<{
      passwordHash: string
      flow: number
    }>
  > {
    const streamingCall = this.cl.listUsers({})
    const accounts: Array<{
      passwordHash: string
      flow: number
    }> = []

    for await (const user of streamingCall.responses) {
      const { status } = user
      const passwordHash = status?.user?.hash
      const upload = status?.trafficTotal?.uploadTraffic
      const download = status?.trafficTotal?.downloadTraffic

      if (!passwordHash) continue

      const uploadInNumber = upload ? Number(upload) : 0
      const downloadInNumber = download ? Number(download) : 0

      accounts.push({
        passwordHash,
        flow: downloadInNumber + uploadInNumber,
      })
    }

    await streamingCall.status

    return accounts
  }

  public async clearFlow(passwordHashList: string[]): Promise<void> {
    const setUserCall = this.cl.setUsers()

    for await (const passwordHash of passwordHashList) {
      await setUserCall.requests.send({
        operation: SetUsersRequest_Operation.Modify,
        status: {
          ipLimit: 0,
          ipCurrent: 0,
          user: {
            hash: passwordHash,
            password: '',
          },
          trafficTotal: {
            uploadTraffic: 0n,
            downloadTraffic: 0n,
          },
        },
      })
    }

    await setUserCall.requests.complete()

    await setUserCall.status
  }

  public disconnect(): void {
    this.transport.close()
  }
}
