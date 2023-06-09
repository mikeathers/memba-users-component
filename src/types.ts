import {PromiseResult} from 'aws-sdk/lib/request'
import {AWSError, DynamoDB} from 'aws-sdk'

export type CreateAccountRequest = {
  authenticatedUserId: string
  addressLineOne: string
  addressLineTwo: string
  doorNumber: string
  townCity: string
  postCode: string
  firstName: string
  lastName: string
  emailAddress: string
  password: string
  tenantName: string
  id: string
  tenantUrl: string
  tenantId: string
  isTenantAdmin: boolean
}
export type CreateAccountInDb = Omit<CreateAccountRequest, 'password'>

export type UpdateAccountRequest = Pick<
  CreateAccountRequest,
  | 'id'
  | 'doorNumber'
  | 'addressLineOne'
  | 'addressLineTwo'
  | 'townCity'
  | 'postCode'
  | 'lastName'
  | 'firstName'
  | 'emailAddress'
  | 'tenantName'
>

export type QueryResult = {
  body: {
    message?: string
    result?:
      | PromiseResult<DynamoDB.DocumentClient.PutItemOutput, AWSError>
      | string
      | DynamoDB.DocumentClient.AttributeMap
  }
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
