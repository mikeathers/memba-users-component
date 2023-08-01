import {DynamoDB} from 'aws-sdk'
import {HttpStatusCode, QueryResult} from '../../../../types'
import {publishDeleteLogEvent} from '../../../../events'
import {queryBySecondaryKey} from '../../../../aws'

interface DeleteAccountProps {
  id: string | undefined
  dbClient: DynamoDB.DocumentClient
  authenticatedUserId: string
}

export const deleteAccount = async (props: DeleteAccountProps): Promise<QueryResult> => {
  const tableName = process.env.TABLE_NAME ?? ''
  const {dbClient, id, authenticatedUserId} = props

  const accountExists = await queryBySecondaryKey({
    queryKey: 'authenticatedUserId',
    queryValue: authenticatedUserId,
    tableName,
    dbClient,
  })

  if (accountExists && accountExists.length < 1) {
    return {
      body: `Account ${id} was not deleted because it does not exist.`,
      statusCode: HttpStatusCode.BAD_REQUEST,
    }
  }

  if (id) {
    const params = {
      TableName: tableName,
      Key: {id},
      ReturnValues: 'ALL_OLD',
    }

    const result = await dbClient.delete(params).promise()
    if (result.Attributes) {
      await publishDeleteLogEvent(
        {
          id,
          userWhoDeletedAccountId: authenticatedUserId,
        },
        'TenantAccountEventLog',
      )

      return {
        body: `Account ${id} has been deleted successfully.`,
        statusCode: HttpStatusCode.OK,
      }
    } else {
      return {
        body: `Account ${id} could not be deleted at this time.`,
        statusCode: HttpStatusCode.BAD_REQUEST,
      }
    }
  } else {
    return {
      body: `An Account Id was missing from the request..`,
      statusCode: HttpStatusCode.BAD_REQUEST,
    }
  }
}
