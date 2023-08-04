import {DynamoDB} from 'aws-sdk'
import {HttpStatusCode, MembaUser, QueryResult} from '../../../../types'
import {getByPrimaryKey} from '../../../../aws'

interface GetAccountByIdProps {
  id: string
  dbClient: DynamoDB.DocumentClient
  authenticatedUserId: string
}
export const getAccountById = async (
  props: GetAccountByIdProps,
): Promise<QueryResult> => {
  const {id, dbClient, authenticatedUserId} = props
  const tableName = process.env.TABLE_NAME ?? ''
  const queryKey = 'id'
  const queryValue = id

  const queryResponse = await getByPrimaryKey({
    queryKey,
    queryValue,
    tableName,
    dbClient,
  })

  if (queryResponse && queryResponse.Item) {
    const result = queryResponse.Item as unknown as MembaUser

    if (result.authenticatedUserId !== authenticatedUserId) {
      return {
        body: `Unauthorized access`,
        statusCode: HttpStatusCode.FORBIDDEN,
      }
    }

    return {
      body: result,
      statusCode: HttpStatusCode.OK,
    }
  }

  return {
    body: `Account with Id: ${id} does not exist.`,
    statusCode: HttpStatusCode.BAD_REQUEST,
  }
}
