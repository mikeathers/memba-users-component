import {DynamoDB} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'

import {CreateAccountRequest, HttpStatusCode, QueryResult} from '../../../../types'
import {validateCreateAccountRequest} from '../../../../validators'
import {queryBySecondaryKey} from '../../../../aws'
import {publishCreateAccountLogEvent} from '../../../../events'

interface CreateAccountProps {
  event: any
  dbClient: DynamoDB.DocumentClient
  authenticatedUserId: string
}

export const createAccount = async (props: CreateAccountProps): Promise<QueryResult> => {
  //eslint-disable-next-line
  const {event, dbClient, authenticatedUserId} = props

  const tableName = process.env.TABLE_NAME ?? ''

  //eslint-disable-next-line
  if (!event.body) {
    return {
      body: {
        message: 'The event is missing a body and cannot be parsed.',
      },
      statusCode: HttpStatusCode.INTERNAL_SERVER,
    }
  }

  //eslint-disable-next-line
  const item = JSON.parse(event.body) as CreateAccountRequest
  item.id = uuidv4()
  item.authenticatedUserId = authenticatedUserId ?? ''
  validateCreateAccountRequest(item)

  const accountExists = await queryBySecondaryKey({
    queryKey: 'authenticatedUserId',
    queryValue: authenticatedUserId,
    tableName,
    dbClient,
  })

  if (accountExists && accountExists?.length > 0) {
    return {
      body: {
        message: 'Account details already exist for the authenticated user.',
      },
      statusCode: HttpStatusCode.BAD_REQUEST,
    }
  }

  await dbClient
    .put({
      TableName: tableName,
      Item: item,
    })
    .promise()

  await publishCreateAccountLogEvent(item)

  return {
    body: {
      message: 'Account created successfully!',
      result: item,
    },
    statusCode: HttpStatusCode.CREATED,
  }
}
