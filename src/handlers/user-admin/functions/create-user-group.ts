import {CognitoIdentityServiceProvider} from 'aws-sdk'

interface createUserGroupProps {
  cognito: CognitoIdentityServiceProvider
  tenantName: string
  userPoolId: string
  userGroupRoleArn: string
}

export const createUserGroup = (props: createUserGroupProps) => {
  try {
    const {cognito, tenantName, userPoolId, userGroupRoleArn} = props

    const params = {
      GroupName: `${tenantName}UsersGroup`,
      UserPoolId: userPoolId,
      Description: `A group for ${tenantName} users`,
      Precedence: 4,
      RoleArn: userGroupRoleArn,
    }

    console.log('Create Group Params: ', params)

    const response = cognito
      .createGroup(params, (err, data) => {
        console.log('CALLBACK')
        console.log('CREATE GROUP ERR: ', err)
        console.log('CREATE GROUP RESULT:', data)
      })
      .promise()
    console.log('RESPONSE: ', response)
  } catch (err) {
    console.error('ERROR', err)
  }
}
