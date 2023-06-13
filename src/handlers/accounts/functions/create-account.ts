import {DynamoDB} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'

import {CreateAccountRequest, HttpStatusCode, QueryResult} from '../../../types'
import {validateCreateAccountRequest} from '../../../validators'
import {queryBySecondaryKey} from '../../../aws'
import {publishCreateAccountLogEvent} from '../../../events'

interface CreateAccountProps {
  event: any
  dbClient: DynamoDB.DocumentClient
  authenticatedUserId: string
  eventType: 'api' | 'eventBridge'
}

export const createAccount = async (props: CreateAccountProps): Promise<QueryResult> => {
  //eslint-disable-next-line
  const {event, dbClient, authenticatedUserId, eventType} = props

  const tableName = process.env.TABLE_NAME ?? ''

  //eslint-disable-next-line
  const eventDetail = eventType === 'api' ? event.body : event.detail

  console.log('EVENT DETAIL: ', eventDetail)

  if (!eventDetail) {
    return {
      body: {
        message: 'The event is missing a body and cannot be parsed.',
      },
      statusCode: HttpStatusCode.INTERNAL_SERVER,
    }
  }

  const item = JSON.parse(eventDetail) as CreateAccountRequest
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
