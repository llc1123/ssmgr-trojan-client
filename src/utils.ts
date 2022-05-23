export const assertNever = (x: never): never => {
  throw new Error('Unexpected object: ' + x)
}

export const isProd = process.env.NODE_ENV === 'production'
