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

interface UserAdminLambdaProps {
  scope: Construct
  stage: string
  eventBus: IEventBus
  deadLetterQueue: IQueue
}

export class UserAdminLambda {
  constructor(props: UserAdminLambdaProps) {
    this.createUserAdminLambda(props)
  }

  private createUserAdminLambda(props: UserAdminLambdaProps) {
    const {scope, stage, eventBus, deadLetterQueue} = props
    const lambdaName = `${CONFIG.STACK_PREFIX}AdminLambda-${stage}`
    const userPoolId = stage === 'prod' ? CONFIG.USER_POOL_ID : CONFIG.DEV_USER_POOL_ID
    const userGroupRoleArnDev = `arn:aws:iam::${CONFIG.AWS_ACCOUNT_ID_DEV}:role/${CONFIG.USER_GROUP_ROLE_ARN}`
    const userGroupRoleArnProd = `arn:aws:iam::${CONFIG.AWS_ACCOUNT_ID_PROD}:role/${CONFIG.USER_GROUP_ROLE_ARN}`
    const userGroupRoleArn = stage === 'prod' ? userGroupRoleArnProd : userGroupRoleArnDev

    const handlerProps: NodejsFunctionProps = {
      functionName: lambdaName,
      environment: {
        USER_POOL_ID: userPoolId,
        USER_GROUP_ROLE_ARN: userGroupRoleArn,
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
      entry: join(__dirname, '../handlers/user-admin'),
      ...handlerProps,
    })

    const userAdminRule = new Rule(scope, 'UserAdminRule', {
      eventBus,
      eventPattern: {
        source: ['UserAdmin'],
        detailType: ['CreateTenantAdminAndUserGroup'],
      },
    })

    userAdminRule.addTarget(new LambdaFunction(userAdminLambda))

    return userAdminLambda
  }
}
