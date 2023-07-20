import {cognito} from './index'

interface CreateTenantUserProps {
  firstName: string
  lastName: string
  userPoolClientId: string
  emailAddress: string
  password: string
}

export const createTenantUser = (props: CreateTenantUserProps) => {
  try {
    const {firstName, lastName, password, emailAddress, userPoolClientId} = props

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
      ],
    }
    return cognito.signUp(params).promise()
  } catch (err) {
    console.log('CREATE TENANT USER ERROR: ', err)
    return null
  }
}
