import {CognitoIdentityServiceProvider} from 'aws-sdk'

interface createUserGroupProps {
  cognito: CognitoIdentityServiceProvider
  tenantName: string
  userPoolId: string
  userGroupRoleArn: string
}

export const createUserGroup = async (props: createUserGroupProps) => {
  try {
    const {cognito, tenantName, userPoolId, userGroupRoleArn} = props

    const params = {
      GroupName: `${tenantName}`,
      UserPoolId: userPoolId,
      Description: `A group for ${tenantName} users`,
      Precedence: 4,
      RoleArn: userGroupRoleArn,
    }

    console.log('Create Group Params: ', params)

    return cognito.createGroup(params).promise()
  } catch (err) {
    console.error('ERROR', err)
    return null
  }
}
