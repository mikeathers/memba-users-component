import {CreateAccountRequest} from '../types'

export class MissingFieldError extends Error {}

// eslint-disable-next-line
export const validateCreateAccountRequest = (arg: CreateAccountRequest): void => {
  if (!arg.firstName) {
    throw new MissingFieldError('Value for firstName required!')
  }
  if (!arg.lastName) {
    throw new MissingFieldError('Value for lastName required!')
  }
  if (!arg.emailAddress) {
    throw new MissingFieldError('Value for emailAddress required!')
  }
  if (!arg.id) {
    throw new MissingFieldError('Value for id required!')
  }
  if (!arg.authenticatedUserId) {
    throw new MissingFieldError('Value for authenticatedUserId required!')
  }
  if (!arg.tenantName) {
    throw new MissingFieldError('Value for tenantName required!')
  }
}
