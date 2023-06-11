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

interface MembaUserComponentStackProps extends StackProps {
  stage: string
}
export class MembaUsersComponentStack extends Stack {
  constructor(scope: Construct, id: string, props: MembaUserComponentStackProps) {
    super(scope, id, props)
    const {stage} = props

    const devEventBusArn = `arn:aws:events:${CONFIG.REGION}:${CONFIG.AWS_ACCOUNT_ID_DEV}:event-bus/${CONFIG.SHARED_EVENT_BUS_NAME}-${stage}`
    const prodEventBusArn = `arn:aws:events:${CONFIG.REGION}:${CONFIG.AWS_ACCOUNT_ID_PROD}:event-bus/${CONFIG.SHARED_EVENT_BUS_NAME}-${stage}`
    const eventBusArn = stage === 'prod' ? prodEventBusArn : devEventBusArn

    const {userPool} = new UserPoolConstruct(this, stage)
    const {userPoolClient} = new UserPoolClientConstruct(this, userPool, stage)
    const {identityPool} = new IdentityPoolConstruct(
      this,
      userPool,
      userPoolClient,
      stage,
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

    const databases = new Databases(
      this,
      `${CONFIG.STACK_PREFIX}Databases-${stage}`,
      stage,
    )

    const deadLetterQueue = new Queue(this, `${CONFIG.STACK_PREFIX}DLQ-${stage}`, {
      retentionPeriod: Duration.days(7),
      queueName: `${CONFIG.STACK_PREFIX}DLQ-${stage}`,
    })

    const {accountsLambda} = new AccountsLambda({
      scope: this,
      stage,
      eventBusArn,
      deadLetterQueue,
      table: databases.accountsTable,
    })

    new AccountApi({
      scope: this,
      stage,
      userPoolId: userPool.userPoolId,
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
