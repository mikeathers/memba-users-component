// eslint-disable-next-line
export const errorHasMessage = (obj: any): obj is Error => {
  return typeof obj === 'object' && 'message' in obj
}
