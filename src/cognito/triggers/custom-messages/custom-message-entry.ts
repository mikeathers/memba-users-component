import {Callback, Context} from 'aws-lambda'

import CustomMessage from './custom-message'

if (!process.env.FRONTEND_BASE_URL) {
  throw new Error('Environment variable FRONTEND_BASE_URL is required.')
}

export type Event = {
  triggerSource: string
  request: {
    codeParameter: string
    userAttributes: {
      'cognito:user_status': string
      // eslint-disable-next-line camelcase
      given_name: string
      // eslint-disable-next-line camelcase
      family_name: string
      email: string
    }
    usernameParameter: string
  }
  response: {
    emailSubject: string
    emailMessage: string
  }
}

// @ts-ignore
export function handler(event, _context: Context, callback: Callback): void {
  console.log('CUSTOM MESSAGE EVENT: ', event)

  const parsedEvent = event as Event
  const {
    triggerSource,
    request: {codeParameter, userAttributes, usernameParameter},
  } = parsedEvent

  const customMessage = new CustomMessage({
    userAttributes,
    codeParameter,
    usernameParameter,
  })

  if (
    triggerSource === 'CustomMessage_SignUp' &&
    userAttributes['cognito:user_status'] === 'UNCONFIRMED'
  ) {
    parsedEvent.response = customMessage.sendCodePostSignUp()
  } else if (triggerSource === 'CustomMessage_ForgotPassword') {
    parsedEvent.response = customMessage.sendCodeForgotPassword()
  } else if (triggerSource === 'CustomMessage_UpdateUserAttribute') {
    parsedEvent.response = customMessage.sendCodeVerifyNewEmail()
  } else if (triggerSource === 'CustomMessage_AdminCreateUser') {
    parsedEvent.response = customMessage.sendTemporaryPassword()
  } else if (triggerSource === 'CustomMessage_ResendCode') {
    parsedEvent.response = customMessage.resendConfirmationCode()
  }

  // Return to Amazon Cognito
  callback(null, parsedEvent)
}
