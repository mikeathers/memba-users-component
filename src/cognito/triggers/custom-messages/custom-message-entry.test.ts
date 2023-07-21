import {Event, handler} from './custom-message-entry'
import {Context} from 'aws-lambda'
import CONFIG from '../../../config'
import {
  completeSignup,
  forgotPassword,
  temporaryPassword,
  verifyNewEmail,
} from './email-messages'

const mockCallBack = jest.fn()
const mockContext = {} as Context
const codeParam = '1000'
const giveName = 'Joe'
const email = 'joe@gmail.com'

const defaultEvent: Event = {
  triggerSource: '',
  request: {
    codeParameter: codeParam,
    userAttributes: {
      'cognito:user_status': '',
      // eslint-disable-next-line camelcase
      given_name: giveName,
      // eslint-disable-next-line camelcase
      family_name: '',
      email,
    },
    usernameParameter: email,
  },
  response: {
    emailSubject: '',
    emailMessage: '',
  },
}

describe('Custom Message Entry', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should invoke callback with correct event for email confirmation', () => {
    const event: Event = {
      ...defaultEvent,
      triggerSource: 'CustomMessage_SignUp',
      request: {
        ...defaultEvent.request,
        userAttributes: {
          ...defaultEvent.request.userAttributes,
          'cognito:user_status': 'UNCONFIRMED',
        },
      },
    }

    handler(event, mockContext, mockCallBack)

    const expectedResult = completeSignup(
      `${CONFIG.FRONTEND_BASE_URL_DEV}/complete-sign-up?code=${codeParam}&emailAddress=${email}`,
    )

    const expectedEvent: Event = {
      ...event,
      response: expectedResult,
    }

    expect(mockCallBack).toHaveBeenCalledWith(null, expectedEvent)
  })

  it('should invoke callback with correct event for forgot password', () => {
    const event: Event = {
      ...defaultEvent,
      triggerSource: 'CustomMessage_ForgotPassword',
    }

    handler(event, mockContext, mockCallBack)

    const expectedResult = forgotPassword(
      `${CONFIG.FRONTEND_BASE_URL_DEV}/reset-password?code=${codeParam}&emailAddress=${email}`,
    )

    const expectedEvent: Event = {
      ...event,
      response: expectedResult,
    }

    expect(mockCallBack).toHaveBeenCalledWith(null, expectedEvent)
  })

  it('should invoke callback with correct event for verify new email', () => {
    const event: Event = {
      ...defaultEvent,
      triggerSource: 'CustomMessage_UpdateUserAttribute',
    }

    handler(event, mockContext, mockCallBack)

    const expectedResult = verifyNewEmail(
      `${CONFIG.FRONTEND_BASE_URL_DEV}/verify-new-email?code=${codeParam}&emailAddress=${email}`,
      giveName,
    )

    const expectedEvent: Event = {
      ...event,
      response: expectedResult,
    }

    expect(mockCallBack).toHaveBeenCalledWith(null, expectedEvent)
  })

  it('should invoke callback with correct event for temporary credentials', () => {
    const event: Event = {
      ...defaultEvent,
      triggerSource: 'CustomMessage_AdminCreateUser',
    }

    handler(event, mockContext, mockCallBack)

    const expectedResult = temporaryPassword(
      `${CONFIG.FRONTEND_BASE_URL_DEV}/login-with-temp-credentials`,
      giveName,
      email,
      codeParam,
    )

    const expectedEvent: Event = {
      ...event,
      response: expectedResult,
    }

    expect(mockCallBack).toHaveBeenCalledWith(null, expectedEvent)
  })
})
