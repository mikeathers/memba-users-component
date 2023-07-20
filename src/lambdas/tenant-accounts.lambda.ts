import path, {join} from 'path'
import {Construct} from 'constructs'
import {Duration} from 'aws-cdk-lib'
import {ITable} from 'aws-cdk-lib/aws-dynamodb'
import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import {IFunction, Runtime, Tracing} from 'aws-cdk-lib/aws-lambda'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {Queue} from 'aws-cdk-lib/aws-sqs'

import CONFIG from '../config'
import {IEventBus, Rule} from 'aws-cdk-lib/aws-events'
import {LambdaFunction} from 'aws-cdk-lib/aws-events-targets'
import {IUserPool} from 'aws-cdk-lib/aws-cognito'
import {Effect, PolicyStatement} from 'aws-cdk-lib/aws-iam'

interface TenantAccountLambdaProps {
  scope: Construct
  stage: string
  table: ITable
  deadLetterQueue: Queue
  eventBus: IEventBus
  userPool: IUserPool
  userPoolClientId: string
  tenantAdminGroupName: string
  userGroupRoleArn: string
}

export class TenantAccountsLambda {
  public tenantAccountsLambda: IFunction

  constructor(props: TenantAccountLambdaProps) {
    this.tenantAccountsLambda = this.createTenantAccountsLambda(props)
  }

  private createTenantAccountsLambda(props: TenantAccountLambdaProps): NodejsFunction {
    const {
      scope,
      stage,
      table,
      eventBus,
      deadLetterQueue,
      userPool,
      userPoolClientId,
      tenantAdminGroupName,
      userGroupRoleArn,
    } = props

    const lambdaName = `${CONFIG.STACK_PREFIX}TenantAccountsLambda`
    const tenantsApiUrl =
      stage === 'prod' ? CONFIG.TENANTS_API_URL : CONFIG.DEV_TENANTS_API_URL
    const tenantsApiSecret =
      stage === 'prod'
        ? CONFIG.TENANTS_API_SECRET_NAME
        : CONFIG.DEV_TENANTS_API_SECRET_NAME

    const lambdaProps: NodejsFunctionProps = {
      functionName: lambdaName,
      environment: {
        PRIMARY_KEY: 'id',
        TABLE_NAME: table.tableName,
        EVENT_BUS_ARN: eventBus.eventBusArn,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClientId,
        TENANT_ADMIN_GROUP_NAME: tenantAdminGroupName,
        TENANTS_API_URL: tenantsApiUrl,
        TENANTS_API_SECRET_NAME: tenantsApiSecret,
      },
      runtime: Runtime.NODEJS_16_X,
      reservedConcurrentExecutions: 1,
      timeout: Duration.minutes(1),
      memorySize: 256,
      tracing: Tracing.DISABLED, // Disables Xray
      logRetention: RetentionDays.FIVE_DAYS,
      bundling: {
        minify: true,
        externalModules: ['aws-sdk'],
        keepNames: true,
        sourceMap: true,
      },
      depsLockFilePath: path.join(__dirname, '..', '..', 'yarn.lock'),
      deadLetterQueueEnabled: true,
      deadLetterQueue,
      retryAttempts: 0,
    }

    const tenantAccountsLambda = new NodejsFunction(scope, lambdaName, {
      entry: join(__dirname, '../handlers/tenant-accounts/index.ts'),
      ...lambdaProps,
    })

    tenantAccountsLambda.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'cognito-idp:CreateGroup',
          'cognito-idp:SignUp',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminDeleteUser',
        ],
        resources: [userPool.userPoolArn],
        effect: Effect.ALLOW,
      }),
    )

    tenantAccountsLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [userGroupRoleArn],
        effect: Effect.ALLOW,
      }),
    )

    tenantAccountsLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'],
        effect: Effect.ALLOW,
      }),
    )

    table.grantReadWriteData(tenantAccountsLambda)

    return tenantAccountsLambda
  }
}
