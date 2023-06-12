import {CognitoIdentityServiceProvider} from 'aws-sdk'

interface CreateAdminUserProps {
  cognito: CognitoIdentityServiceProvider
  groupName: string
  firstName: string
  lastName: string
  userPoolClientId: string
  email: string
  password: string
  username: string
}

export const createAdminUser = (props: CreateAdminUserProps) => {
  try {
    const {
      groupName,
      lastName,
      firstName,
      password,
      userPoolClientId,
      email,
      cognito,
      username,
    } = props

    const params = {
      ClientId: userPoolClientId,
      Password: password,
      Username: username,
      UserAttributes: [
        {
          Name: 'given_name',
          Value: firstName,
        },
        {
          Name: 'family_name',
          Value: lastName,
        },
        {
          Name: 'custom:isTenantAdmin',
          Value: 'true',
        },
        {
          Name: 'email',
          Value: email,
        },
      ],
      ClientMetaData: {
        groupName,
      },
    }
    return cognito.signUp(params).promise()
  } catch (err) {
    console.log('CREATE ADMIN USER ERROR: ', err)
    return null
  }
}
