import path, {join} from 'path'
import {
  AccountRecovery,
  BooleanAttribute,
  CfnUserPool,
  ProviderAttribute,
  UserPool,
  UserPoolIdentityProviderApple,
  UserPoolIdentityProviderGoogle,
} from 'aws-cdk-lib/aws-cognito'
import {Effect, Policy, PolicyStatement} from 'aws-cdk-lib/aws-iam'
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs'
import {Runtime, Tracing} from 'aws-cdk-lib/aws-lambda'
import {Construct} from 'constructs'
import {Duration, RemovalPolicy} from 'aws-cdk-lib'
import * as SecretsManager from 'aws-cdk-lib/aws-secretsmanager'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'

import CONFIG from '../../config'

export class UserPoolConstruct {
  public userPool: UserPool
  // public googleIdentityProvider: UserPoolIdentityProviderGoogle
  // public appleIdentityProvider: UserPoolIdentityProviderApple
  private readonly scope: Construct
  private readonly customMessagesTrigger: NodejsFunction
  private readonly postConfirmationTrigger: NodejsFunction
  private readonly preSignUpTrigger: NodejsFunction
  private readonly stage: string

  constructor(scope: Construct, stage: string) {
    this.scope = scope
    this.stage = stage
    this.preSignUpTrigger = this.createPreSignUpTrigger()
    this.postConfirmationTrigger = this.createPostConfirmationTrigger()
    this.customMessagesTrigger = this.createCustomMessagesTrigger()
    this.userPool = this.createUserPool()
    this.createTriggerPoliciesAndAssignToRoles()
    this.addHostedUIDomain()
    // this.addSES()
    // this.googleIdentityProvider = this.addGoogleIdentityProvider()
    // this.appleIdentityProvider = this.addAppleIdentityProvider()
  }

  private createPostConfirmationTrigger() {
    return new NodejsFunction(this.scope, 'PostConfirmationTrigger', {
      runtime: Runtime.NODEJS_16_X,
      memorySize: 256,
      timeout: Duration.seconds(6),
      entry: join(__dirname, '../triggers/post-confirmation/index.ts'),
      tracing: Tracing.DISABLED, // Disables Xray
      logRetention: RetentionDays.ONE_DAY,
      bundling: {
        minify: true,
        externalModules: ['aws-sdk'],
        keepNames: true,
        sourceMap: true,
      },
      depsLockFilePath: path.join(__dirname, '..', '..', '..', 'yarn.lock'),
    })
  }

  private createPreSignUpTrigger() {
    return new NodejsFunction(this.scope, 'PreSignUpTrigger', {
      runtime: Runtime.NODEJS_16_X,
      memorySize: 256,
      timeout: Duration.seconds(6),
      entry: join(__dirname, '../triggers/pre-sign-up/index.ts'),
      tracing: Tracing.DISABLED, // Disables Xray
      logRetention: RetentionDays.ONE_DAY,
      bundling: {
        minify: true,
        externalModules: ['aws-sdk'],
        keepNames: true,
        sourceMap: true,
      },
      depsLockFilePath: path.join(__dirname, '..', '..', '..', 'yarn.lock'),
    })
  }

  private createCustomMessagesTrigger() {
    return new NodejsFunction(this.scope, 'CustomMessagesTrigger', {
      runtime: Runtime.NODEJS_16_X,
      memorySize: 256,
      timeout: Duration.seconds(6),
      entry: join(__dirname, '../triggers/custom-messages/index.ts'),
      tracing: Tracing.DISABLED, // Disables Xray
      logRetention: RetentionDays.ONE_DAY,
      bundling: {
        minify: true,
        externalModules: ['aws-sdk'],
        keepNames: true,
        sourceMap: true,
      },
      depsLockFilePath: path.join(__dirname, '..', '..', '..', 'yarn.lock'),
      environment: {
        FRONTEND_BASE_URL:
          this.stage === 'prod'
            ? CONFIG.FRONTEND_BASE_URL_PROD
            : CONFIG.FRONTEND_BASE_URL_DEV,
      },
    })
  }

  private createTriggerPoliciesAndAssignToRoles() {
    const adminAddUserToGroupPolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['cognito-idp:AdminAddUserToGroup'],
      resources: [this.userPool.userPoolArn],
    })

    this.postConfirmationTrigger.role?.attachInlinePolicy(
      new Policy(this.scope, 'PostConfirmTriggerPolicy', {
        statements: [adminAddUserToGroupPolicyStatement],
      }),
    )

    const manageUsersPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'cognito-idp:AdminAddUserToGroup',
        'cognito-idp:AdminUpdateUserAttributes',
        'cognito-idp:ListUsers',
        'cognito-idp:AdminLinkProviderForUser',
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminSetUserPassword',
      ],
      resources: [this.userPool.userPoolArn],
    })

    this.preSignUpTrigger.role?.attachInlinePolicy(
      new Policy(this.scope, 'ManageCognitoPolicy', {
        statements: [manageUsersPolicy],
      }),
    )
  }

  private addSES() {
    const accountId =
      this.stage === 'prod' ? CONFIG.AWS_ACCOUNT_ID_PROD : CONFIG.AWS_ACCOUNT_ID_DEV
    const emailAddress =
      this.stage === 'prod'
        ? CONFIG.AWS_NO_REPLY_EMAIL_PROD
        : CONFIG.AWS_NO_REPLY_EMAIL_DEV
    const suffix = this.stage === 'prod' ? CONFIG.DOMAIN_URL : CONFIG.DEV_DOMAIN_URL
    const noReply = this.stage === 'prod' ? 'no-reply' : 'no-reply-dev'
    const cfnUserPool = this.userPool.node.defaultChild as CfnUserPool

    cfnUserPool.emailConfiguration = {
      emailSendingAccount: 'DEVELOPER',
      from: `Memba <${noReply}@${suffix}>`,
      sourceArn: `arn:aws:ses:${CONFIG.REGION}:${accountId}:identity/${emailAddress}`,
    }
  }

  private createUserPool() {
    const userPoolName = `SharedUserPool`

    return new UserPool(this.scope, userPoolName, {
      userPoolName,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      customAttributes: {
        isMembaAdmin: new BooleanAttribute({mutable: true}),
        isTenantAdmin: new BooleanAttribute({mutable: true}),
      },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
      lambdaTriggers: {
        customMessage: this.customMessagesTrigger,
        // postConfirmation: this.postConfirmationTrigger,
        preSignUp: this.preSignUpTrigger,
      },
    })
  }

  private addHostedUIDomain() {
    const uniquePrefix = CONFIG.STACK_PREFIX.toLowerCase()
    this.userPool.addDomain(uniquePrefix, {
      cognitoDomain: {
        domainPrefix: uniquePrefix,
      },
    })
  }

  private addGoogleIdentityProvider() {
    const devSecretArn =
      'arn:aws:secretsmanager:eu-west-2:214394749062:secret:google-client-credentials-jM1GTj'
    const prodSecretArn =
      'arn:aws:secretsmanager:eu-west-2:943918019765:secret:google-client-credentials-YkdWSz'
    const secretArn = this.stage === 'prod' ? prodSecretArn : devSecretArn

    const googleSecret = SecretsManager.Secret.fromSecretCompleteArn(
      this.scope,
      'GoogleClientSecret',
      secretArn,
    )

    const clientId = googleSecret.secretValueFromJson('google-client-id').unsafeUnwrap()
    const clientSecret = googleSecret
      .secretValueFromJson('google-client-secret')
      .unsafeUnwrap()

    return new UserPoolIdentityProviderGoogle(this.scope, 'GoogleIdentityProvider', {
      userPool: this.userPool,
      clientId,
      clientSecret,
      scopes: ['email', 'profile', 'openid'],
      attributeMapping: {
        email: ProviderAttribute.GOOGLE_EMAIL,
        familyName: ProviderAttribute.GOOGLE_FAMILY_NAME,
        givenName: ProviderAttribute.GOOGLE_GIVEN_NAME,
      },
    })
  }

  private addAppleIdentityProvider() {
    const devSecretArn =
      'arn:aws:secretsmanager:eu-west-2:214394749062:secret:apple-client-credentials-g7CKBd'
    const prodSecretArn =
      'arn:aws:secretsmanager:eu-west-2:214394749062:secret:apple-client-credentials-g7CKBd'
    const secretArn = this.stage === 'prod' ? prodSecretArn : devSecretArn

    const appleSecret = SecretsManager.Secret.fromSecretCompleteArn(
      this.scope,
      'AppleClientSecret',
      secretArn,
    )

    const clientId = appleSecret.secretValueFromJson('apple-client-id').unsafeUnwrap()
    const teamId = appleSecret.secretValueFromJson('apple-team-id').unsafeUnwrap()
    const keyId = appleSecret.secretValueFromJson('apple-key-id').unsafeUnwrap()
    const privateKey = appleSecret.secretValueFromJson('apple-private-key').unsafeUnwrap()

    return new UserPoolIdentityProviderApple(this.scope, 'AppleIdentityProvider', {
      userPool: this.userPool,
      clientId,
      teamId,
      keyId,
      privateKey,
      scopes: ['email', 'name'],
      attributeMapping: {
        email: ProviderAttribute.APPLE_EMAIL,
        familyName: ProviderAttribute.APPLE_LAST_NAME,
        givenName: ProviderAttribute.APPLE_FIRST_NAME,
      },
    })
  }
}
