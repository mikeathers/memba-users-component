import {
  CreateAccountRequest,
  CreateTenantAccountRequest,
  UpdateAccountRequest,
} from '../types'

export type CreateAccountEvent = CreateAccountRequest

export type CreateAccountLogEvent = CreateAccountRequest | CreateTenantAccountRequest
export type UpdateAccountLogEvent = UpdateAccountRequest
export type DeleteAccountLogEvent = {
  id: string
  userWhoDeletedAccountId: string
}
