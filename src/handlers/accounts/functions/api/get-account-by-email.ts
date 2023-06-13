import {DynamoDB} from 'aws-sdk'
import {HttpStatusCode, QueryResult} from '../../../../types'
import {queryBySecondaryKey} from '../../../../aws'

interface GetAccountByIdProps {
  emailAddress: string
  dbClient: DynamoDB.DocumentClient
}
export const getAccountByEmail = async (
  props: GetAccountByIdProps,
): Promise<QueryResult> => {
  const {emailAddress, dbClient} = props
  const tableName = process.env.TABLE_NAME ?? ''
  const queryKey = 'emailAddress'
  const queryValue = emailAddress

  const queryResponse = await queryBySecondaryKey({
    queryKey,
    queryValue,
    tableName,
    dbClient,
  })

  if (queryResponse && queryResponse.length > 0) {
    return {
      body: {
        message: 'Account has been found.',
        result: queryResponse[0],
      },
      statusCode: HttpStatusCode.OK,
    }
  }

  return {
    body: {
      message: `Account with email: ${emailAddress} does not exist.`,
    },
    statusCode: HttpStatusCode.BAD_REQUEST,
  }
}
