import {CognitoIdentityServiceProvider, DynamoDB} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'

import {
  CreateAccountInDb,
  CreateAccountRequest,
  HttpStatusCode,
  QueryResult,
} from '../../../../types'
import {validateCreateAccountRequest} from '../../../../validators'
import {queryBySecondaryKey} from '../../../../aws'
import {publishCreateLogEvent} from '../../../../events'
import CONFIG from '../../../../config'
import {addUserToGroup, createUser, createUserGroup} from '../../../../aws/cognito'
import {rollbackCreateAccount} from './rollback-create-account'

interface CreateAccountProps {
  //eslint-disable-next-line
  event: any
  dbClient: DynamoDB.DocumentClient
}

export const cognito = new CognitoIdentityServiceProvider({region: CONFIG.REGION})

export const createAccount = async (props: CreateAccountProps): Promise<QueryResult> => {
  //eslint-disable-next-line
  const {event, dbClient} = props

  const tableName = process.env.TABLE_NAME ?? ''
  const userPoolId = process.env.USER_POOL_ID ?? ''
  const userPoolClientId = process.env.USER_POOL_CLIENT_ID ?? ''

  //eslint-disable-next-line
  if (!event.body) {
    return {
      body: 'The event is missing a body and cannot be parsed.',
      statusCode: HttpStatusCode.INTERNAL_SERVER,
    }
  }

  //eslint-disable-next-line
  const item = JSON.parse(event.body) as CreateAccountRequest
  item.id = uuidv4()
  validateCreateAccountRequest(item)

  const accountExists = await queryBySecondaryKey({
    queryKey: 'emailAddress',
    queryValue: item.emailAddress,
    tableName,
    dbClient,
  })

  if (accountExists && accountExists?.length > 0) {
    return {
      body: 'Account details already exist for the user.',
      statusCode: HttpStatusCode.BAD_REQUEST,
    }
  }

  try {
    const userResult = await createUser({
      firstName: item.firstName,
      lastName: item.lastName,
      password: item.password,
      emailAddress: item.emailAddress,
      userPoolClientId,
    })

    item.authenticatedUserId = userResult?.UserSub ?? ''

    const dbUserDetails = item as CreateAccountInDb

    await dbClient
      .put({
        TableName: tableName,
        Item: dbUserDetails,
      })
      .promise()

    await addUserToGroup({
      groups: [item.appName],
      username: item.emailAddress,
      userPoolId,
    })

    await publishCreateLogEvent(item, 'AccountEventLog')

    return {
      body: item,
      statusCode: HttpStatusCode.CREATED,
    }
  } catch (error) {
    console.log('CREATE USER ERROR', error)

    await rollbackCreateAccount({
      userId: item.id,
      username: item.emailAddress,
      groupName: item.appName,
      userPoolId,
      authenticatedUserId: item.authenticatedUserId,
      dbClient,
    })

    return {
      body: 'The account failed to create.',
      statusCode: HttpStatusCode.INTERNAL_SERVER,
    }
  }
}
