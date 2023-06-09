import {Callback, Context, PreSignUpTriggerEvent} from 'aws-lambda'
import {
  adminAddUserToGroup,
  adminCreateUser,
  adminLinkUserAccounts,
  adminSetUserPassword,
  listUsersByEmail,
} from './pre-sign-up'

export async function handler(
  event: PreSignUpTriggerEvent,
  _context: Context,
  callback: Callback,
): Promise<void> {
  try {
    const {
      triggerSource,
      userPoolId,
      userName,
      request: {
        userAttributes: {email, given_name, family_name},
      },
    } = event

    const EXTERNAL_AUTHENTICATION_PROVIDER = 'PreSignUp_ExternalProvider'

    console.log('EVENT: ', event)

    if (triggerSource === EXTERNAL_AUTHENTICATION_PROVIDER) {
      console.log('triggerSource === EXTERNAL_AUTHENTICATION_PROVIDER')
      const usersFilteredByEmail = await listUsersByEmail({
        userPoolId,
        email,
      })
      console.log('usersFilteredByEmail:', usersFilteredByEmail)

      const [providerNameValue, providerUserId] = userName.split('_')
      const providerName =
        providerNameValue.charAt(0).toUpperCase() + providerNameValue.slice(1)

      const isAppleSignIn = providerNameValue.toLowerCase().includes('apple')

      console.log('providerName: ', providerName)

      if (usersFilteredByEmail.Users && usersFilteredByEmail.Users.length > 0) {
        const cognitoUsername =
          usersFilteredByEmail.Users[0].Username || 'username-not-found'
        console.log('User has cognito account: ', cognitoUsername)
        await adminLinkUserAccounts({
          username: cognitoUsername,
          userPoolId,
          providerName,
          providerUserId,
        })
      } else {
        console.log('User does not have cognito account')

        const createdCognitoUser = await adminCreateUser({
          userPoolId,
          email,
          givenName: given_name || isAppleSignIn ? '' : given_name,
          familyName: family_name || isAppleSignIn ? '' : family_name,
        })

        console.log('createdCognitoUser: ', createdCognitoUser)

        await adminSetUserPassword({userPoolId, email})

        const cognitoNativeUsername =
          createdCognitoUser.User?.Username || 'username-not-found'

        await adminLinkUserAccounts({
          username: cognitoNativeUsername,
          userPoolId,
          providerName,
          providerUserId,
        })

        // OPTIONALLY add the user to a group
        await adminAddUserToGroup({
          userPoolId,
          username: cognitoNativeUsername,
          groupName: 'Users',
        })

        event.response.autoVerifyEmail = true
        event.response.autoConfirmUser = true
      }
    }
    return callback(null, event)
  } catch (err) {
    console.log('ERROR: ', err)
    // @ts-ignore
    return callback(err, event)
  }
}
