import {publishCreateUserAccountEvent} from '../../events'
import {addUserToGroup, createUser, createUserGroup} from '../../aws/cognito'
import {CreateAccountRequest} from '../../types'

//eslint-disable-next-line
async function handler(event: any) {
  try {
    //eslint-disable-next-line
    if (event['detail-type'] !== undefined) {
      //eslint-disable-next-line
      if (event['detail-type'] === 'CreateTenantAdminAndUserGroup') {
        const userPoolId = process.env.USER_POOL_ID ?? ''
        const userGroupRoleArn = process.env.USER_GROUP_ROLE_ARN ?? ''
        const userPoolClientId = process.env.USER_POOL_CLIENT_ID ?? ''
        const tenantAdminGroupName = process.env.TENANT_ADMIN_GROUP_NAME ?? ''

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
          //eslint-disable-next-line
        } = event.detail as CreateAccountRequest

        await createUserGroup({
          userGroupRoleArn,
          groupName: tenantName,
          userPoolId,
        })

        const userResult = await createUser({
          firstName,
          lastName,
          userPoolClientId,
          emailAddress,
          password,
          tenantId,
          isTenantAdmin: true,
        })

        console.log('USER RESULT: ', userResult)

        await publishCreateUserAccountEvent({
          authenticatedUserId: userResult?.UserSub ?? '',
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

        await addUserToGroup({
          groups: [tenantName, tenantAdminGroupName],
          userPoolId,
          username: emailAddress,
        })
      }
    }
  } catch (error) {
    console.log('USER ADMIN HANDLER ERROR: ', error)
    throw error
  }
}

export {handler}
