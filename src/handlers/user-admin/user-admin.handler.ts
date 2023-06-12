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
          id: uuidv4(),
        })
      })

      const addAdminToUserGroupResult = await addAdminToUserGroup({
        cognito,
        userPoolId,
        groupName: tenantName,
        username: emailAddress,
      })

      console.log('CREATE GROUP RESULT: ', createUserGroupResult)
      console.log('CREATE ADMIN RESULT: ', createAdminUserResult)
      console.log('ADD ADMIN TO GROUP RESULT: ', addAdminToUserGroupResult)
    }
  }
}

export {handler}
