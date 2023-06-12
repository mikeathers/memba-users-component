import {CognitoIdentityServiceProvider} from 'aws-sdk'

interface CreateAdminUserProps {
  cognito: CognitoIdentityServiceProvider
  firstName: string
  lastName: string
  userPoolClientId: string
  email: string
  password: string
}

export const createAdminUser = (props: CreateAdminUserProps) => {
  try {
    const {lastName, firstName, password, userPoolClientId, email, cognito} = props

    const params = {
      ClientId: userPoolClientId,
      Password: password,
      Username: email,
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
    }
    return cognito.signUp(params).promise()
  } catch (err) {
    console.log('CREATE ADMIN USER ERROR: ', err)
    return null
  }
}
