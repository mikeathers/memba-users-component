import {AWSError, CognitoIdentityServiceProvider, Response} from 'aws-sdk'

const cognitoIdp = new CognitoIdentityServiceProvider()

export function addUserToGroup({
  userPoolId,
  username,
  groupName,
}: {
  userPoolId: string
  username: string
  groupName: string
}): Promise<{
  $response: Response<Record<string, string>, AWSError>
}> {
  const params = {
    GroupName: groupName,
    UserPoolId: userPoolId,
    Username: username,
  }

  return cognitoIdp.adminAddUserToGroup(params).promise()
}
