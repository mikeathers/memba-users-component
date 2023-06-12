import {CognitoIdentityServiceProvider} from 'aws-sdk'

interface createUserGroupProps {
  cognito: CognitoIdentityServiceProvider
  tenantName: string
  userPoolId: string
  userGroupRoleArn: string
}

export const createUserGroup = (props: createUserGroupProps) => {
  const {cognito, tenantName, userPoolId, userGroupRoleArn} = props

  const params = {
    GroupName: `${tenantName}UsersGroup`,
    UserPoolId: userPoolId,
    Description: `A group for ${tenantName} users`,
    Precedence: 4,
    RoleArn: userGroupRoleArn,
  }

  console.log('Create Group Params: ', params)

  const result = cognito.createGroup(params)

  console.log('Create Group Result: ', result)
}
