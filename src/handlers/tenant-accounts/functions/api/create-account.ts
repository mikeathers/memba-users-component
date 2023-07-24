import {CognitoIdentityServiceProvider, DynamoDB} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'

import {
  CreateAccountInDb,
  CreateAccountRequest,
  HttpStatusCode,
  QueryResult,
} from '../../../../types'
import {
  validateCreateAccountRequest,
  validateCreateTenantAccountRequest,
} from '../../../../validators'
import {queryBySecondaryKey} from '../../../../aws'
import {publishCreateLogEvent} from '../../../../events'
import CONFIG from '../../../../config'
import {addUserToGroup, createUser, createUserGroup} from '../../../../aws/cognito'
import {rollbackCreateAccount} from './rollback-create-account'
import {createTenantUser} from '../../../../aws/cognito'
import {createTenant} from './create-tenant'

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
  const tenantAdminGroupName = process.env.TENANT_ADMIN_GROUP_NAME ?? ''
  const tenantsApiUrl = process.env.TENANTS_API_URL ?? ''
  const tenantsApiSecretName = process.env.TENANTS_API_SECRET_NAME ?? ''

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
  item.isTenantAdmin = true
  validateCreateTenantAccountRequest(item)

  const accountExists = await queryBySecondaryKey({
    queryKey: 'emailAddress',
    queryValue: item.emailAddress,
    tableName,
    dbClient,
  })

  if (accountExists && accountExists?.length > 0) {
    return {
      body: {
        message: 'An account already exists with the details you have provided.',
      },
      statusCode: HttpStatusCode.BAD_REQUEST,
    }
  }

  try {
    const userResult = await createTenantUser({
      firstName: item.firstName,
      lastName: item.lastName,
      password: item.password,
      emailAddress: item.emailAddress,
      userPoolClientId,
    })

    const tenant = await createTenant({
      tenantAdminId: item.id,
      tenantsApiUrl,
      tenantsApiSecretName,
    })
    console.log('TENANT: ', tenant)
    item.authenticatedUserId = userResult?.UserSub ?? ''
    item.tenantId = tenant.id

    const dbUserDetails = item as CreateAccountInDb

    await dbClient
      .put({
        TableName: tableName,
        Item: dbUserDetails,
      })
      .promise()

    await addUserToGroup({
      groups: [tenantAdminGroupName],
      username: item.emailAddress,
      userPoolId,
    })

    const {password, ...rest} = item

    await publishCreateLogEvent({...rest}, 'TenantAccountEventLog')

    return {
      body: {
        message: 'Account created successfully!',
        result: item,
      },
      statusCode: HttpStatusCode.CREATED,
    }
  } catch (error) {
    console.log('CREATE TENANT USER ERROR', error)

    await rollbackCreateAccount({
      userId: item.id,
      username: item.emailAddress,
      groupName: tenantAdminGroupName,
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
