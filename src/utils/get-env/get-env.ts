export const getEnv = (envName: string) => {
  const envVar = process.env[envName]
  if (envVar === undefined) {
    throw new Error(`'process.env.${envName}' is undefined`)
  }
  return envVar
}
