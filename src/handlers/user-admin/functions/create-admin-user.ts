import {CognitoIdentityServiceProvider} from 'aws-sdk'

interface CreateAdminUserProps {
  cognito: CognitoIdentityServiceProvider
  firstName: string
  lastName: string
  userPoolClientId: string
  emailAddress: string
  password: string
  tenantId: string
}

export const createAdminUser = (props: CreateAdminUserProps) => {
  try {
    const {
      lastName,
      firstName,
      password,
      userPoolClientId,
      emailAddress,
      cognito,
      tenantId,
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
          Name: 'custom:isTenantAdmin',
          Value: 'true',
        },
        {
          Name: 'email',
          Value: emailAddress,
        },
        {
          Name: 'custom:tenantId',
          Value: tenantId,
        },
      ],
    }
    return cognito.signUp(params).promise()
  } catch (err) {
    console.log('CREATE ADMIN USER ERROR: ', err)
    return null
  }
}
