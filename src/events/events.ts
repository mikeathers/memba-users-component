import {CreateAccountRequest, UpdateAccountRequest} from '../types'

export type CreateAccountEvent = CreateAccountRequest

export type CreateAccountLogEvent = CreateAccountRequest
export type UpdateAccountLogEvent = UpdateAccountRequest
export type DeleteAccountLogEvent = {
  id: string
  userWhoDeletedAccountId: string
}
