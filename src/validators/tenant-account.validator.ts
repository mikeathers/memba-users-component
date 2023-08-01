import {CreateTenantAccountRequest} from '../types'
import {MissingFieldError} from './account.validator'

export const validateCreateTenantAccountRequest = (
  arg: CreateTenantAccountRequest,
): void => {
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
}
