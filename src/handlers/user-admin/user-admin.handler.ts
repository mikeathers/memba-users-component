/* eslint-disable */
import {CognitoIdentityServiceProvider} from 'aws-sdk'
import {createUserGroup} from './functions/create-user-group'
import CONFIG from '../../config'

const cognito = new CognitoIdentityServiceProvider({region: CONFIG.REGION})

async function handler(event: any) {
  if (event['detail-type'] !== undefined) {
    if (event['detail-type'] === 'CreateTenantAdminAndUserGroup') {
      const userPoolId = process.env.USER_POOL_ID ?? ''
      const userGroupRoleArn = process.env.USER_GROUP_ROLE_ARN ?? ''

      console.log('User Admin Handler')
      console.log('Details: ', {userPoolId, userGroupRoleArn})

      const result = await createUserGroup({
        cognito,
        tenantName: event.detail.tenantName,
        userPoolId,
        userGroupRoleArn,
      })

      console.log('RESULT: ', result)
    }
  }
}

export {handler}
