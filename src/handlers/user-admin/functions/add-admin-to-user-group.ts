import {CognitoIdentityServiceProvider} from 'aws-sdk'

interface AddAdminToUserGroupProps {
  cognito: CognitoIdentityServiceProvider
  groupName: string
  userPoolId: string
  username: string
  tenantAdminRole: string
}

export const addAdminToUserGroup = async (props: AddAdminToUserGroupProps) => {
  try {
    const {cognito, groupName, userPoolId, username, tenantAdminRole} = props

    const tenantSpecificGroupParams = {
      GroupName: groupName,
      UserPoolId: userPoolId,
      Username: username,
    }

    const tenantAdminGroupParams = {
      GroupName: tenantAdminRole,
      UserPoolId: userPoolId,
      Username: username,
    }

    await cognito.adminAddUserToGroup(tenantSpecificGroupParams).promise()
    await cognito.adminAddUserToGroup(tenantAdminGroupParams).promise()
  } catch (error) {
    console.log('ADD ADMIN TO GROUP ERROR: ', error)
  }
}
