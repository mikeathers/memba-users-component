import {DynamoDB} from 'aws-sdk'
import {HttpStatusCode, MembaUser, QueryResult} from '../../../../types'
import {queryBySecondaryKey} from '../../../../aws'
import {getTenantDetails} from './get-tenant-details'

interface GetAccountByIdProps {
  emailAddress: string
  dbClient: DynamoDB.DocumentClient
  authenticatedUserId: string
}
export const getAccountByEmail = async (
  props: GetAccountByIdProps,
): Promise<QueryResult> => {
  const {emailAddress, dbClient, authenticatedUserId} = props
  const tableName = process.env.TABLE_NAME ?? ''
  const tenantsApiUrl = process.env.TENANTS_API_URL ?? ''
  const tenantsApiSecretName = process.env.TENANTS_API_SECRET_NAME ?? ''
  const queryKey = 'emailAddress'
  const queryValue = emailAddress

  const queryResponse = await queryBySecondaryKey({
    queryKey,
    queryValue,
    tableName,
    dbClient,
  })

  console.log({queryResponse})

  if (queryResponse && queryResponse.length > 0) {
    const result = queryResponse[0] as unknown as MembaUser

    if (result.authenticatedUserId !== authenticatedUserId) {
      return {
        body: `Unauthorized access`,
        statusCode: HttpStatusCode.FORBIDDEN,
      }
    }

    const tenant = await getTenantDetails({
      tenantId: result.tenantId,
      tenantsApiUrl,
      tenantsApiSecretName,
    })

    console.log({tenant})
    return {
      body: {...result, tenant},
      statusCode: HttpStatusCode.OK,
    }
  }

  return {
    body: `Account with email: ${emailAddress} does not exist.`,
    statusCode: HttpStatusCode.BAD_REQUEST,
  }
}
