/* eslint-disable */
import {CognitoIdentityServiceProvider} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'

import {createUserGroup} from './functions/create-user-group'
import CONFIG from '../../config'
import {createAdminUser} from './functions/create-admin-user'
import {addAdminToUserGroup} from './functions/add-admin-to-user-group'

const cognito = new CognitoIdentityServiceProvider({region: CONFIG.REGION})

async function handler(event: any) {
  if (event['detail-type'] !== undefined) {
    if (event['detail-type'] === 'CreateTenantAdminAndUserGroup') {
      const userPoolId = process.env.USER_POOL_ID ?? ''
      const userGroupRoleArn = process.env.USER_GROUP_ROLE_ARN ?? ''
      const userPoolClientId = process.env.USER_POOL_CLIENT_ID ?? ''

      console.log('User Admin Handler')
      console.log('Details: ', {userPoolId, userGroupRoleArn})

      const {
        tenantName,
        tenantAdminFirstName,
        tenantAdminLastName,
        tenantAdminEmail,
        tenantAdminPassword,
      } = event.detail

      const username = uuidv4()

      const createUserGroupResult = await createUserGroup({
        cognito,
        tenantName,
        userPoolId,
        userGroupRoleArn,
      })

      const createAdminUserResult = await createAdminUser({
        cognito,
        firstName: tenantAdminFirstName,
        lastName: tenantAdminLastName,
        userPoolClientId,
        email: tenantAdminEmail,
        password: tenantAdminPassword,
        username,
      })

      const addAdminToUserGroupResult = await addAdminToUserGroup({
        cognito,
        userPoolId,
        groupName: tenantName,
        username,
      })

      console.log('CREATE GROUP RESULT: ', createUserGroupResult)
      console.log('CREATE ADMIN RESULT: ', createAdminUserResult)
      console.log('ADD ADMIN TO GROUP RESULT: ', addAdminToUserGroupResult)
    }
  }
}

export {handler}
