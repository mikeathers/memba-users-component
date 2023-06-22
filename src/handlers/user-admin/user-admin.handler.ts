/* eslint-disable */
import {CognitoIdentityServiceProvider} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'

import {createUserGroup} from './functions/create-user-group'
import CONFIG from '../../config'
import {createAdminUser} from './functions/create-admin-user'
import {addAdminToUserGroup} from './functions/add-admin-to-user-group'
import {publishCreateUserAccountEvent} from '../../events'

const cognito = new CognitoIdentityServiceProvider({region: CONFIG.REGION})

async function handler(event: any) {
  if (event['detail-type'] !== undefined) {
    if (event['detail-type'] === 'CreateTenantAdminAndUserGroup') {
      const userPoolId = process.env.USER_POOL_ID ?? ''
      const userGroupRoleArn = process.env.USER_GROUP_ROLE_ARN ?? ''
      const userPoolClientId = process.env.USER_POOL_CLIENT_ID ?? ''
      const tenantAdminRole = process.env.TENANT_ADMIN_ROLE ?? ''

      console.log('User Admin Handler')
      console.log('Details: ', {userPoolId, userGroupRoleArn})

      const {
        tenantName,
        firstName,
        lastName,
        emailAddress,
        password,
        addressLineOne,
        addressLineTwo,
        doorNumber,
        townCity,
        postCode,
        tenantUrl,
        tenantId,
      } = event.detail

      const createUserGroupResult = await createUserGroup({
        cognito,
        tenantName,
        userPoolId,
        userGroupRoleArn,
      })

      const createAdminUserResult = await createAdminUser({
        cognito,
        firstName,
        lastName,
        userPoolClientId,
        emailAddress,
        password,
        tenantId,
      })?.then(async (res) => {
        await publishCreateUserAccountEvent({
          authenticatedUserId: res.UserSub,
          addressLineOne,
          addressLineTwo,
          doorNumber,
          townCity,
          postCode,
          firstName,
          lastName,
          emailAddress,
          tenantName,
          tenantUrl,
          tenantId,
          isTenantAdmin: true,
        })
      })

      await addAdminToUserGroup({
        cognito,
        userPoolId,
        groupName: tenantName,
        username: emailAddress,
        tenantAdminRole,
      })

      console.log('CREATE GROUP RESULT: ', createUserGroupResult)
      console.log('CREATE ADMIN RESULT: ', createAdminUserResult)
    }
  }
}

export {handler}
