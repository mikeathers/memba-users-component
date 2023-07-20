import {Construct} from 'constructs'
import {IFunction} from 'aws-cdk-lib/aws-lambda'
import {
  ApiKey,
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  CorsOptions,
  LambdaIntegration,
  MethodOptions,
  Period,
  RestApi,
  UsagePlanProps,
} from 'aws-cdk-lib/aws-apigateway'
import {IUserPool} from 'aws-cdk-lib/aws-cognito'
import {ServicePrincipal} from 'aws-cdk-lib/aws-iam'
import {ARecord, IHostedZone, RecordTarget} from 'aws-cdk-lib/aws-route53'
import {ApiGateway} from 'aws-cdk-lib/aws-route53-targets'
import {ICertificate} from 'aws-cdk-lib/aws-certificatemanager'
import CONFIG from '../config'
import {Secret} from 'aws-cdk-lib/aws-secretsmanager'
import {UsagePlanPerApiStage} from 'aws-cdk-lib/aws-apigateway/lib/usage-plan'

interface AccountApiProps {
  scope: Construct
  tenantAccountsLambda: IFunction
  stage: string
  userPool: IUserPool
  certificate: ICertificate
  hostedZone: IHostedZone
}

export class TenantAccountsApi {
  constructor(props: AccountApiProps) {
    this.createTenantAccountsApi(props)
  }

  private createTenantAccountsApi(props: AccountApiProps) {
    const {scope, tenantAccountsLambda, stage, userPool, certificate, hostedZone} = props

    const restApiName = `${CONFIG.STACK_PREFIX}-Api`

    const authorizer = new CognitoUserPoolsAuthorizer(
      scope,
      `${CONFIG.STACK_PREFIX}ApiAuthorizer`,
      {
        cognitoUserPools: [userPool],
        authorizerName: `${CONFIG.STACK_PREFIX}ApiAuthorizer`,
        identitySource: 'method.request.header.Authorization',
      },
    )

    const cognitoMethodOptions: MethodOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.authorizerId,
      },
    }

    const apiKeyMethodOptions: MethodOptions = {
      apiKeyRequired: true,
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

    tenantAccountsLambda.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com'))

    authorizer._attachToApi(api)

    api.root.addCorsPreflight(optionsWithCors)

    const secret = new Secret(scope, `${CONFIG.STACK_PREFIX}ApiSecret`, {
      generateSecretString: {
        generateStringKey: 'api_key',
        secretStringTemplate: JSON.stringify({username: 'web_user'}),
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
    })

    const apiKeyName = 'x-api-key'

    const apiKey = new ApiKey(scope, `AccountsApiKey`, {
      apiKeyName,
      description: `APIKey used to access resources`,
      enabled: true,
      value: secret.secretValueFromJson('api_key').unsafeUnwrap(),
    })

    const apiStage: UsagePlanPerApiStage = {
      api,
      stage: api.deploymentStage,
    }

    const usagePlanProps: UsagePlanProps = {
      name: 'AccountsApiUsagePlan',
      apiStages: [apiStage],
      throttle: {burstLimit: 500, rateLimit: 1000},
      quota: {limit: 10000000, period: Period.MONTH},
    }

    const usagePlan = api.addUsagePlan('AccountsUsagePlan', usagePlanProps)
    usagePlan.addApiKey(apiKey)

    const root = api.root

    root
      .addResource('create-account')
      .addMethod('POST', new LambdaIntegration(tenantAccountsLambda))

    root
      .addResource('get-all-accounts')
      .addMethod('GET', new LambdaIntegration(tenantAccountsLambda), cognitoMethodOptions)

    const getAccountById = root.addResource('get-account-by-id')
    getAccountById
      .addResource('{id}')
      .addMethod('GET', new LambdaIntegration(tenantAccountsLambda), cognitoMethodOptions)

    const getAccountByEmail = root.addResource('get-account-by-email')
    getAccountByEmail
      .addResource('{emailAddress}')
      .addMethod('GET', new LambdaIntegration(tenantAccountsLambda), apiKeyMethodOptions)

    root
      .addResource('update-account')
      .addMethod('PUT', new LambdaIntegration(tenantAccountsLambda), cognitoMethodOptions)

    const deleteAccount = root.addResource('delete-account')

    deleteAccount
      .addResource('{id}')
      .addMethod(
        'DELETE',
        new LambdaIntegration(tenantAccountsLambda),
        cognitoMethodOptions,
      )

    new ARecord(scope, `${CONFIG.STACK_PREFIX}AccountApiAliasRecord`, {
      recordName: domainName,
      zone: hostedZone,
      target: RecordTarget.fromAlias(new ApiGateway(api)),
    })
  }
}
