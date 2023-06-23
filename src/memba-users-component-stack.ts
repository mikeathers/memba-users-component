import {Construct} from 'constructs'
import {CfnOutput, Duration, Stack, StackProps} from 'aws-cdk-lib'
import {
  IdentityPoolConstruct,
  UserPoolClientConstruct,
  UserPoolConstruct,
} from './cognito'
import CONFIG from './config'
import {getHostedZone} from './aws/route53'
import {createCertificate} from './aws/certificate'
import {Databases} from './databases'
import {Queue} from 'aws-cdk-lib/aws-sqs'
import {AccountsLambda} from './lambdas'
import {AccountApi} from './api-gateway'
import {UserAdminLambda} from './lambdas/user-admin.lambda'
import {EventBus} from 'aws-cdk-lib/aws-events'

interface MembaUserComponentStackProps extends StackProps {
  stage: string
}

export class MembaUsersComponentStack extends Stack {
  constructor(scope: Construct, id: string, props: MembaUserComponentStackProps) {
    super(scope, id, props)
    const {stage} = props

    const accountId = Stack.of(this).account
    const region = Stack.of(this).region

    const eventBusArn = `arn:aws:events:${region}:${accountId}:event-bus/${CONFIG.SHARED_EVENT_BUS_NAME}`

    const {userPool} = new UserPoolConstruct({scope: this, stage, region, accountId})
    const {userPoolClient} = new UserPoolClientConstruct(this, userPool, stage)
    const {identityPool, usersRole, tenantAdminGroupName} = new IdentityPoolConstruct(
      this,
      userPool,
      userPoolClient,
    )

    const hostedZoneUrl = stage === 'prod' ? CONFIG.DOMAIN_URL : CONFIG.DEV_DOMAIN_URL

    const hostedZone = getHostedZone({scope: this, domainName: hostedZoneUrl})

    const accountApiCertificate = createCertificate({
      scope: this,
      hostedZone,
      name: `${CONFIG.STACK_PREFIX}AccountsApiCertificate`,
      url: stage === 'prod' ? CONFIG.API_URL : CONFIG.DEV_API_URL,
      region: 'eu-west-2',
    })

    const databases = new Databases(this, `${CONFIG.STACK_PREFIX}Databases`)

    const deadLetterQueue = new Queue(this, `${CONFIG.STACK_PREFIX}-DLQ`, {
      retentionPeriod: Duration.days(7),
      queueName: `${CONFIG.STACK_PREFIX}-DLQ`,
    })

    const eventBus = EventBus.fromEventBusArn(this, `SharedEventBus`, eventBusArn)

    const {accountsLambda} = new AccountsLambda({
      scope: this,
      eventBus,
      deadLetterQueue,
      table: databases.accountsTable,
      userPool,
      userPoolClientId: userPoolClient.userPoolClientId,
      userGroupRoleArn: usersRole.roleArn,
      tenantAdminGroupName,
    })

    new UserAdminLambda({
      scope: this,
      eventBus,
      deadLetterQueue,
      userPool,
      userGroupRoleArn: usersRole.roleArn,
      userPoolClientId: userPoolClient.userPoolClientId,
      tenantAdminGroupName,
    })

    new AccountApi({
      scope: this,
      stage,
      userPool,
      accountsLambda,
      certificate: accountApiCertificate,
      hostedZone,
    })

    // Outputs
    new CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    })

    new CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    })

    new CfnOutput(this, 'IdentityPoolId', {
      value: identityPool.ref,
    })
  }
}
