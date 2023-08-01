import {DynamoDB} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'

import {CreateTenantAccountRequest} from '../../../../types'
import {validateCreateTenantAccountRequest} from '../../../../validators'
import {queryBySecondaryKey} from '../../../../aws'
import {publishCreateLogEvent} from '../../../../events'

interface CreateAccountProps {
  //eslint-disable-next-line
  event: any
  dbClient: DynamoDB.DocumentClient
}

type CreateTenantAccountRequestEventBridge = Omit<CreateTenantAccountRequest, 'id'>

export const createAccount = async (props: CreateAccountProps) => {
  //eslint-disable-next-line
  const {event, dbClient} = props

  const tableName = process.env.TABLE_NAME ?? ''

  //eslint-disable-next-line
  console.log('EVENT DETAIL: ', event.detail)

  //eslint-disable-next-line
  if (!event.detail) {
    throw Error('Event body is missing details')
  }

  //eslint-disable-next-line
  const paredItem = event.detail as CreateTenantAccountRequestEventBridge

  const item: CreateTenantAccountRequest = {
    ...paredItem,
    id: uuidv4(),
  }

  validateCreateTenantAccountRequest(item)

  const accountExists = await queryBySecondaryKey({
    queryKey: 'authenticatedUserId',
    queryValue: item.authenticatedUserId,
    tableName,
    dbClient,
  })

  if (accountExists && accountExists?.length > 0) {
    throw Error(
      `Account details already exist for the authenticated user. ID: ${item.authenticatedUserId}`,
    )
  }

  await dbClient
    .put({
      TableName: tableName,
      Item: item,
    })
    .promise()

  await publishCreateLogEvent(item, 'TenantAccountEventLog')
}
