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

interface AccountLambdaProps {
  scope: Construct
  table: ITable
  deadLetterQueue: Queue
  eventBus: IEventBus
  userPool: IUserPool
  userPoolClientId: string
}

export class AccountsLambda {
  public accountsLambda: IFunction

  constructor(props: AccountLambdaProps) {
    this.accountsLambda = this.createAccountsLambda(props)
  }

  private createAccountsLambda(props: AccountLambdaProps): NodejsFunction {
    const {scope, table, eventBus, deadLetterQueue, userPool, userPoolClientId} = props

    const lambdaName = `${CONFIG.STACK_PREFIX}AccountsLambda`

    const lambdaProps: NodejsFunctionProps = {
      functionName: lambdaName,
      environment: {
        PRIMARY_KEY: 'id',
        TABLE_NAME: table.tableName,
        EVENT_BUS_ARN: eventBus.eventBusArn,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClientId,
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

    const accountLambda = new NodejsFunction(scope, lambdaName, {
      entry: join(__dirname, '../handlers/accounts/index.ts'),
      ...lambdaProps,
    })

    const createUserRule = new Rule(scope, 'CreateUserRule', {
      eventBus,
      eventPattern: {
        source: ['Users'],
        detailType: ['Create'],
      },
    })

    createUserRule.addTarget(new LambdaFunction(accountLambda))

    table.grantReadWriteData(accountLambda)

    return accountLambda
  }
}
