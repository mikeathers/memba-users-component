import {CognitoIdentityServiceProvider, DynamoDB} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'

import {CreateAccountRequest, HttpStatusCode, QueryResult} from '../../../../types'
import {validateCreateAccountRequest} from '../../../../validators'
import {queryBySecondaryKey} from '../../../../aws'
import {publishCreateAccountLogEvent} from '../../../../events'
import CONFIG from '../../../../config'
import {addUserToGroup, createUser} from '../../../../aws/cognito'
import {rollbackCreateAccount} from './rollback-create-account'

interface CreateAccountProps {
  //eslint-disable-next-line
  event: any
  dbClient: DynamoDB.DocumentClient
  authenticatedUserId: string
  isTenantAdmin: boolean
}

export const cognito = new CognitoIdentityServiceProvider({region: CONFIG.REGION})

export const createAccount = async (props: CreateAccountProps): Promise<QueryResult> => {
  //eslint-disable-next-line
  const {event, dbClient, authenticatedUserId, isTenantAdmin} = props

  const tableName = process.env.TABLE_NAME ?? ''
  const userPoolId = process.env.USER_POOL_ID ?? ''
  const userPoolClientId = process.env.USER_POOL_CLIENT_ID ?? ''

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
  item.isTenantAdmin = isTenantAdmin
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

  try {
    const userResult = await createUser({
      firstName: item.firstName,
      lastName: item.lastName,
      password: item.password,
      emailAddress: item.password,
      userPoolClientId,
      tenantId: item.tenantId,
      isTenantAdmin,
    })

    item.authenticatedUserId = userResult?.UserSub ?? ''

    await dbClient
      .put({
        TableName: tableName,
        Item: item,
      })
      .promise()

    addUserToGroup({
      groups: [item.tenantName],
      username: item.emailAddress,
      userPoolId,
    })

    await publishCreateAccountLogEvent(item)

    return {
      body: {
        message: 'Account created successfully!',
        result: item,
      },
      statusCode: HttpStatusCode.CREATED,
    }
  } catch (error) {
    console.log('CREATE USER ERROR', error)

    await rollbackCreateAccount({
      userId: item.id,
      username: item.emailAddress,
      groupName: item.tenantName,
      userPoolId,
      authenticatedUserId: item.authenticatedUserId,
      dbClient,
    })

    return {
      body: {
        message: 'The account failed to create.',
        result: item,
      },
      statusCode: HttpStatusCode.INTERNAL_SERVER,
    }
  }
}
