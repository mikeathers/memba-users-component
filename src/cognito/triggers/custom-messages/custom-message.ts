import {
  completeSignup,
  forgotPassword,
  temporaryPassword,
  verifyNewEmail,
} from './email-messages'

export type CustomMessageReturnValue = {
  emailSubject: string
  emailMessage: string
}

export type CustomMessageProps = {
  codeParameter: string
  userAttributes: {
    // eslint-disable-next-line camelcase
    given_name: string
    // eslint-disable-next-line camelcase
    family_name: string
    email: string
  }
  usernameParameter: string
}

class CustomMessage {
  FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL
  FRONTEND_LINKS: {
    SEND_CODE_POST_SIGN_UP: string
    SEND_CODE_FORGOT_PASSWORD: string
    SEND_CODE_VERIFY_NEW_EMAIL: string
    SEND_TEMPORARY_PASSWORD: string
    RESEND_CONFIRMATION_CODE: string
  }

  private userAttributes: {
    // eslint-disable-next-line camelcase
    given_name: string
    // eslint-disable-next-line camelcase
    family_name: string
    email: string
  }

  private readonly codeParameter: string
  private readonly usernameParameter: string

  constructor(props: CustomMessageProps) {
    this.userAttributes = props.userAttributes
    this.codeParameter = props.codeParameter
    this.usernameParameter = props.usernameParameter

    this.FRONTEND_LINKS = {
      SEND_CODE_POST_SIGN_UP: `${this.FRONTEND_BASE_URL}/complete-registration?code=${this.codeParameter}&emailAddress=${this.userAttributes.email}`,
      SEND_CODE_FORGOT_PASSWORD: `${this.FRONTEND_BASE_URL}/complete-password-reset?code=${this.codeParameter}&emailAddress=${this.userAttributes.email}`,
      SEND_CODE_VERIFY_NEW_EMAIL: `${this.FRONTEND_BASE_URL}/verify-new-email?code=${this.codeParameter}&emailAddress=${this.userAttributes.email}`,
      SEND_TEMPORARY_PASSWORD: `${this.FRONTEND_BASE_URL}/login-with-temp-credentials`,
      RESEND_CONFIRMATION_CODE: `${this.FRONTEND_BASE_URL}/complete-registration?code=${this.codeParameter}&emailAddress=${this.userAttributes.email}`,
    }
  }

  sendCodePostSignUp(): CustomMessageReturnValue {
    return {
      ...completeSignup(this.FRONTEND_LINKS.SEND_CODE_POST_SIGN_UP),
    }
  }

  sendCodeForgotPassword(): CustomMessageReturnValue {
    return {
      ...forgotPassword(this.FRONTEND_LINKS.SEND_CODE_FORGOT_PASSWORD),
    }
  }

  sendCodeVerifyNewEmail(): CustomMessageReturnValue {
    return {
      ...verifyNewEmail(
        this.FRONTEND_LINKS.SEND_CODE_VERIFY_NEW_EMAIL,
        this.userAttributes.given_name,
      ),
    }
  }

  sendTemporaryPassword(): CustomMessageReturnValue {
    return {
      ...temporaryPassword(
        this.FRONTEND_LINKS.SEND_TEMPORARY_PASSWORD,
        this.userAttributes.given_name,
        this.usernameParameter,
        this.codeParameter,
      ),
    }
  }

  resendConfirmationCode(): CustomMessageReturnValue {
    return {
      ...completeSignup(this.FRONTEND_LINKS.RESEND_CONFIRMATION_CODE),
    }
  }
}

export default CustomMessage
