import {cognito} from './index'
import {CognitoIdentityServiceProvider} from 'aws-sdk'

interface CreateAdminUserProps {
  firstName: string
  lastName: string
  userPoolClientId: string
  emailAddress: string
  password: string
  signUpRedirectUrl: string
}

export const createUser = (
  props: CreateAdminUserProps,
): Promise<CognitoIdentityServiceProvider.Types.SignUpResponse> | null => {
  try {
    const {
      firstName,
      lastName,
      password,
      emailAddress,
      userPoolClientId,
      signUpRedirectUrl,
    } = props

    const params = {
      ClientId: userPoolClientId,
      Password: password,
      Username: emailAddress,
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
          Name: 'email',
          Value: emailAddress,
        },
        {
          Name: 'custom:signUpRedirectUrl',
          Value: signUpRedirectUrl,
        },
      ],
    }
    return cognito.signUp(params).promise()
  } catch (err) {
    console.log('CREATE USER ERROR: ', err)
    throw err
  }
}
