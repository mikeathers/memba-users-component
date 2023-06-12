import {CognitoIdentityServiceProvider} from 'aws-sdk'

interface AddAdminToUserGroupProps {
  cognito: CognitoIdentityServiceProvider
  groupName: string
  userPoolId: string
  username: string
}

export const addAdminToUserGroup = (props: AddAdminToUserGroupProps) => {
  try {
    const {cognito, groupName, userPoolId, username} = props

    const params = {
      GroupName: groupName,
      UserPoolId: userPoolId,
      Username: username,
    }

    return cognito.adminAddUserToGroup(params).promise()
  } catch (error) {
    console.log('ADD ADMIN TO GROUP ERROR: ', error)
    return null
  }
}
