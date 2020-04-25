interface TrojanClientResult {
  acctId?: number
  flow?: {
    acctId: number
    flow: number
  }[]
  version?: string
}

/**
 * Redis table structure:
 *  HSET acctId<number> password key<SHA224 string> download bytes<number> upload bytes<number>
 */

abstract class TrojanClient {
  public static addAccount = async (
    acctId: number,
    password: string,
  ): Promise<TrojanClientResult> => {
    // doSomething
    return { acctId }
  }

  public static removeAccount = async (
    acctId: number,
  ): Promise<TrojanClientResult> => {
    // doSomething
    return { acctId }
  }

  public static getFlow = async (): Promise<TrojanClientResult> => {
    // doSomething
    return { flow: [] }
  }

  public static getVersion = (): TrojanClientResult => {
    return { version: process.env.npm_package_version || 'unknown' }
  }
}

export { TrojanClient, TrojanClientResult }
