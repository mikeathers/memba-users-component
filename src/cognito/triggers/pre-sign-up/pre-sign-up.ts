import {CognitoIdentityServiceProvider, Response, AWSError} from 'aws-sdk'

export const listUsersByEmail = async ({
  userPoolId,
  email,
}: {
  userPoolId: string
  email: string
}): Promise<CognitoIdentityServiceProvider.ListUsersResponse> => {
  const params = {
    UserPoolId: userPoolId,
    Filter: `email = "${email}"`,
  }

  const cognitoIdp = new CognitoIdentityServiceProvider()
  return cognitoIdp.listUsers(params).promise()
}

export const adminLinkUserAccounts = async ({
  username,
  userPoolId,
  providerName,
  providerUserId,
}: {
  username: string
  userPoolId: string
  providerName: string
  providerUserId: string
}): Promise<CognitoIdentityServiceProvider.AdminLinkProviderForUserResponse> => {
  const params = {
    DestinationUser: {
      ProviderAttributeValue: username,
      ProviderName: 'Cognito',
    },
    SourceUser: {
      ProviderAttributeName: 'Cognito_Subject',
      ProviderAttributeValue: providerUserId,
      ProviderName: providerName,
    },
    UserPoolId: userPoolId,
  }

  const cognitoIdp = new CognitoIdentityServiceProvider()
  return new Promise((resolve, reject) => {
    cognitoIdp.adminLinkProviderForUser(params, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      resolve(data)
    })
  })
}

export const adminCreateUser = async ({
  userPoolId,
  email,
  givenName,
  familyName,
}: {
  userPoolId: string
  email: string
  givenName: string
  familyName: string
}): Promise<CognitoIdentityServiceProvider.AdminCreateUserResponse> => {
  const params = {
    UserPoolId: userPoolId,
    MessageAction: 'SUPPRESS',
    Username: email,
    UserAttributes: [
      {
        Name: 'given_name',
        Value: givenName,
      },
      {
        Name: 'family_name',
        Value: familyName,
      },
      {
        Name: 'email',
        Value: email,
      },
      {
        Name: 'email_verified',
        Value: 'True',
      },
    ],
  }

  const cognitoIdp = new CognitoIdentityServiceProvider()
  return cognitoIdp.adminCreateUser(params).promise()
}

export const adminSetUserPassword = async ({
  userPoolId,
  email,
}: {
  userPoolId: string
  email: string
}): Promise<CognitoIdentityServiceProvider.AdminSetUserPasswordResponse> => {
  const params = {
    Password: generatePassword(),
    UserPoolId: userPoolId,
    Username: email,
    Permanent: true,
  }

  const cognitoIdp = new CognitoIdentityServiceProvider()
  return cognitoIdp.adminSetUserPassword(params).promise()
}

function generatePassword() {
  return `H${Math.random().toString(36).slice(-8)}42!`
}

export function adminAddUserToGroup({
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

  const cognitoIdp = new CognitoIdentityServiceProvider()
  return cognitoIdp.adminAddUserToGroup(params).promise()
}
