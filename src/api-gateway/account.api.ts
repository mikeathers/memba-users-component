import {Construct} from 'constructs'
import {IFunction} from 'aws-cdk-lib/aws-lambda'
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  CorsOptions,
  LambdaIntegration,
  MethodOptions,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway'
import {UserPool} from 'aws-cdk-lib/aws-cognito'
import {ServicePrincipal} from 'aws-cdk-lib/aws-iam'
import {ARecord, IHostedZone, RecordTarget} from 'aws-cdk-lib/aws-route53'
import {ApiGateway} from 'aws-cdk-lib/aws-route53-targets'
import {ICertificate} from 'aws-cdk-lib/aws-certificatemanager'
import CONFIG from '../config'

interface AccountApiProps {
  scope: Construct
  accountsLambda: IFunction
  stage: string
  userPoolId: string
  certificate: ICertificate
  hostedZone: IHostedZone
}

export class AccountApi {
  constructor(props: AccountApiProps) {
    this.createAccountApi(props)
  }

  private createAccountApi(props: AccountApiProps) {
    const {scope, accountsLambda, stage, userPoolId, certificate, hostedZone} = props
    const userPool = UserPool.fromUserPoolId(scope, 'UserPool', userPoolId)

    const restApiName = `${CONFIG.STACK_PREFIX}Api (${stage})`

    const authorizer = new CognitoUserPoolsAuthorizer(
      scope,
      `${CONFIG.STACK_PREFIX}ApiAuthorizer-${stage}`,
      {
        cognitoUserPools: [userPool],
        authorizerName: `${CONFIG.STACK_PREFIX}ApiAuthorizer-${stage}`,
        identitySource: 'method.request.header.Authorization',
      },
    )

    const methodOptions: MethodOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.authorizerId,
      },
    }

    const optionsWithCors: CorsOptions = {
      allowOrigins: Cors.ALL_ORIGINS,
      allowMethods: Cors.ALL_METHODS,
      allowHeaders: [
        'Content-Type',
        'X-Amz-Date',
        'Authorization',
        'X-Api-Key',
        'X-Amz-Security-Token',
      ],
      allowCredentials: true,
    }

    const domainName = stage === 'prod' ? `${CONFIG.API_URL}` : `${CONFIG.DEV_API_URL}`

    const api = new RestApi(scope, restApiName, {
      restApiName,
      domainName: {
        domainName,
        certificate,
      },
    })

    accountsLambda.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com'))

    authorizer._attachToApi(api)

    api.root.addCorsPreflight(optionsWithCors)

    const root = api.root

    root
      .addResource('get-all-accounts')
      .addMethod('GET', new LambdaIntegration(accountsLambda), methodOptions)

    root
      .addResource('create-account')
      .addMethod('POST', new LambdaIntegration(accountsLambda), methodOptions)

    const getAccountById = root.addResource('get-account-by-id')
    getAccountById
      .addResource('{id}')
      .addMethod('GET', new LambdaIntegration(accountsLambda), methodOptions)

    const getAccountByEmail = root.addResource('get-account-by-email')
    getAccountByEmail
      .addResource('{emailAddress}')
      .addMethod('GET', new LambdaIntegration(accountsLambda), methodOptions)

    root
      .addResource('update-account')
      .addMethod('PUT', new LambdaIntegration(accountsLambda), methodOptions)

    const deleteAccount = root.addResource('delete-account')

    deleteAccount
      .addResource('{id}')
      .addMethod('DELETE', new LambdaIntegration(accountsLambda), methodOptions)

    new ARecord(scope, `${CONFIG.STACK_PREFIX}AccountApiAliasRecord`, {
      recordName: domainName,
      zone: hostedZone,
      target: RecordTarget.fromAlias(new ApiGateway(api)),
    })
  }
}
