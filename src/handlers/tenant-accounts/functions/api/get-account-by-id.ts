import {DynamoDB} from 'aws-sdk'
import {HttpStatusCode, MembaUser, QueryResult} from '../../../../types'
import {getByPrimaryKey} from '../../../../aws'
import {getTenantDetails} from './get-tenant-details'

interface GetAccountByIdProps {
  id: string
  dbClient: DynamoDB.DocumentClient
}
export const getAccountById = async (
  props: GetAccountByIdProps,
): Promise<QueryResult> => {
  const {id, dbClient} = props
  const tableName = process.env.TABLE_NAME ?? ''
  const tenantsApiUrl = process.env.TENANTS_API_URL ?? ''
  const tenantsApiSecretName = process.env.TENANTS_API_SECRET_NAME ?? ''
  const queryKey = 'id'
  const queryValue = id

  const queryResponse = await getByPrimaryKey({
    queryKey,
    queryValue,
    tableName,
    dbClient,
  })

  console.log('GET TENANT ACCOUNT RESPONSE: ', queryResponse)

  if (queryResponse && queryResponse.Item) {
    const tenant = await getTenantDetails({
      tenantId: (queryResponse.Item as unknown as MembaUser).tenantId,
      tenantsApiUrl,
      tenantsApiSecretName,
    })
    console.log('TENANT: ', tenant)
    return {
      body: {
        message: 'Account has been found.',
        result: {
          ...queryResponse.Item,
          tenant,
        },
      },
      statusCode: HttpStatusCode.OK,
    }
  }

  return {
    body: {
      message: `Account with Id: ${id} does not exist.`,
    },
    statusCode: HttpStatusCode.BAD_REQUEST,
  }
}
