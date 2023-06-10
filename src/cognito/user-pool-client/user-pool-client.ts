import {Construct} from 'constructs'
import {
  ClientAttributes,
  OAuthScope,
  UserPool,
  UserPoolClient,
  UserPoolClientIdentityProvider,
  UserPoolIdentityProviderApple,
  UserPoolIdentityProviderGoogle,
} from 'aws-cdk-lib/aws-cognito'

import CONFIG from '../../config'

export class UserPoolClientConstruct {
  public userPoolClient: UserPoolClient
  private readonly scope: Construct
  private readonly userPool: UserPool
  private readonly stage: string

  constructor(
    scope: Construct,
    userPool: UserPool,
    stage: string,
    googleIdentityProvider?: UserPoolIdentityProviderGoogle,
    appleIdentityProvider?: UserPoolIdentityProviderApple,
  ) {
    this.scope = scope
    this.stage = stage
    this.userPool = userPool

    if (googleIdentityProvider && appleIdentityProvider) {
      this.userPoolClient = this.createUserPoolClient(
        googleIdentityProvider,
        appleIdentityProvider,
      )
    }
    this.userPoolClient = this.createUserPoolClient()
  }

  private createUserPoolClient(
    googleIdentityProvider?: UserPoolIdentityProviderGoogle,
    appleIdentityProvider?: UserPoolIdentityProviderApple,
  ) {
    const standardCognitoAttributes = {
      givenName: true,
      familyName: true,
      email: true,
      emailVerified: true,
      phoneNumberVerified: true,
      lastUpdateTime: true,
    }

    const clientReadAttributes = new ClientAttributes()
      .withStandardAttributes(standardCognitoAttributes)
      .withCustomAttributes(...['isMembaAdmin', 'isTenantAdmin'])

    const clientWriteAttributes = new ClientAttributes().withStandardAttributes({
      ...standardCognitoAttributes,
      emailVerified: false,
      phoneNumberVerified: false,
    })

    const userPoolClientName = `${CONFIG.STACK_PREFIX}UserPoolClient-${this.stage}`

    const callbackUrl =
      this.stage === 'prod'
        ? `https://${CONFIG.DOMAIN_URL}/app/oauth-redirect`
        : `https://${CONFIG.DEV_DOMAIN_URL}/app/oauth-redirect`

    const userPoolClient = new UserPoolClient(this.scope, userPoolClientName, {
      userPoolClientName,
      userPool: this.userPool,
      authFlows: {
        adminUserPassword: true,
        custom: true,
        userSrp: true,
        userPassword: true,
      },
      supportedIdentityProviders: [
        UserPoolClientIdentityProvider.COGNITO,
        // UserPoolClientIdentityProvider.GOOGLE,
        // UserPoolClientIdentityProvider.APPLE,
      ],
      readAttributes: clientReadAttributes,
      writeAttributes: clientWriteAttributes,
      oAuth: {
        callbackUrls: [callbackUrl],
        flows: {
          implicitCodeGrant: true,
        },
        scopes: [
          OAuthScope.COGNITO_ADMIN,
          OAuthScope.EMAIL,
          OAuthScope.OPENID,
          OAuthScope.PHONE,
          OAuthScope.PROFILE,
        ],
      },
    })

    if (googleIdentityProvider) userPoolClient.node.addDependency(googleIdentityProvider)
    if (appleIdentityProvider) userPoolClient.node.addDependency(appleIdentityProvider)

    return userPoolClient
  }
}
