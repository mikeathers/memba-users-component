import {DynamoDB} from 'aws-sdk'
import {queryBySecondaryKey} from '../../../../aws'
import {HttpStatusCode, MembaUser} from '../../../../types'

interface IsTenantAdminProps {
  emailAddress: string
  dbClient: DynamoDB.DocumentClient
}

export const adminCheck = async (props: IsTenantAdminProps) => {
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
    const result = queryResponse[0] as unknown as MembaUser
    if (result.isTenantAdmin || result.isMembaAdmin) {
      return {
        body: null,
        statusCode: HttpStatusCode.OK,
      }
    }
  }

  return {
    body: null,
    statusCode: HttpStatusCode.FORBIDDEN,
  }
}
