import {CognitoIdentityServiceProvider} from 'aws-sdk'

interface AddAdminToUserGroupProps {
  cognito: CognitoIdentityServiceProvider
  groupName: string
  userPoolId: string
  username: string
}

export const addUserToGroup = async (props: AddAdminToUserGroupProps) => {
  try {
    const {cognito, groupName, userPoolId, username} = props

    const tenantSpecificGroupParams = {
      GroupName: groupName,
      UserPoolId: userPoolId,
      Username: username,
    }

    await cognito.adminAddUserToGroup(tenantSpecificGroupParams).promise()
  } catch (error) {
    console.log('ADD ADMIN TO GROUP ERROR: ', error)
  }
}
