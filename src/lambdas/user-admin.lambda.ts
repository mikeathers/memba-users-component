import {Construct} from 'constructs'
import {IEventBus, Rule} from 'aws-cdk-lib/aws-events'
import {IQueue} from 'aws-cdk-lib/aws-sqs'
import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import CONFIG from '../config'
import path, {join} from 'path'
import {Runtime, Tracing} from 'aws-cdk-lib/aws-lambda'
import {Duration} from 'aws-cdk-lib'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {LambdaFunction} from 'aws-cdk-lib/aws-events-targets'
import {Effect, IRole, PolicyStatement} from 'aws-cdk-lib/aws-iam'
import {IUserPool} from 'aws-cdk-lib/aws-cognito'

interface UserAdminLambdaProps {
  scope: Construct
  eventBus: IEventBus
  deadLetterQueue: IQueue
  userPool: IUserPool
  userGroupRoleArn: string
  userPoolClientId: string
  tenantAdminRole: IRole
}

export class UserAdminLambda {
  constructor(props: UserAdminLambdaProps) {
    this.createUserAdminLambda(props)
  }

  private createUserAdminLambda(props: UserAdminLambdaProps) {
    const {
      scope,
      eventBus,
      deadLetterQueue,
      userGroupRoleArn,
      userPool,
      userPoolClientId,
      tenantAdminRole,
    } = props

    const lambdaName = `${CONFIG.STACK_PREFIX}AdminLambda`
    // const accountId = Stack.of(scope).account

    const handlerProps: NodejsFunctionProps = {
      functionName: lambdaName,
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        USER_GROUP_ROLE_ARN: userGroupRoleArn,
        USER_POOL_CLIENT_ID: userPoolClientId,
        EVENT_BUS_ARN: eventBus.eventBusArn,
        TENANT_ADMIN_ROLE: tenantAdminRole.roleName,
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

    const userAdminLambda = new NodejsFunction(scope, lambdaName, {
      entry: join(__dirname, '../handlers/user-admin/index.ts'),
      ...handlerProps,
    })

    const userAdminRule = new Rule(scope, 'UserAdminRule', {
      eventBus,
      eventPattern: {
        source: ['UserAdmin'],
        detailType: ['CreateTenantAdminAndUserGroup'],
      },
    })

    userAdminLambda.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'cognito-idp:CreateGroup',
          'cognito-idp:SignUp',
          'cognito-idp:AdminAddUserToGroup',
        ],
        resources: [userPool.userPoolArn],
        effect: Effect.ALLOW,
      }),
    )

    userAdminLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [userGroupRoleArn],
        effect: Effect.ALLOW,
      }),
    )

    userAdminRule.addTarget(new LambdaFunction(userAdminLambda))

    return userAdminLambda
  }
}
