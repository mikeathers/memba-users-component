import {PromiseResult} from 'aws-sdk/lib/request'
import {AWSError, DynamoDB} from 'aws-sdk'

export type MembaUser = {
  authenticatedUserId: string
  emailAddress: string
  firstName: string
  id: string
  isTenantAdmin: boolean
  isMembaAdmin: boolean
  lastName: string
  tenantId: string
}

export type Membership = {
  name: string
  price: number
}

export type MembaApp = {
  name: string
  memberships: Membership[]
  id: string
  url: string
  tier: string
  type: 'gym-management'
  tenantId: string
  groupName: string
}

export type CreateAccountRequest = {
  authenticatedUserId: string
  firstName: string
  lastName: string
  emailAddress: string
  password: string
  id: string
  groupName: string
  isTenantAdmin?: boolean
  isMembaAdmin?: boolean
  tenantId?: string
  appId: string
}

export type CreateTenantAccountRequest = {
  authenticatedUserId: string
  firstName: string
  lastName: string
  emailAddress: string
  password: string
  id: string
  isTenantAdmin?: boolean
  isMembaAdmin?: boolean
}

export type CreateAccountInDb = Omit<CreateAccountRequest, 'password'>

export type UpdateAccountRequest = Pick<
  CreateAccountRequest,
  'lastName' | 'firstName' | 'emailAddress' | 'groupName' | 'id'
>

export type QueryResult = {
  // eslint-disable-next-line
  body: any
  statusCode: number
}

export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  MULTI_STATUS = 207,
  BAD_REQUEST = 400,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER = 500,
}
