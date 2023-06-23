import {cognito} from './index'

interface CreateAdminUserProps {
  firstName: string
  lastName: string
  userPoolClientId: string
  emailAddress: string
  password: string
  tenantId: string
  isTenantAdmin: boolean
}

export const createUser = (props: CreateAdminUserProps) => {
  try {
    const {
      firstName,
      lastName,
      password,
      emailAddress,
      userPoolClientId,
      tenantId,
      isTenantAdmin,
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
          Value: String(isTenantAdmin),
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
    console.log('CREATE USER ERROR: ', err)
    return null
  }
}
