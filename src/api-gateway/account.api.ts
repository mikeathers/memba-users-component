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
  accountsLambda: IFunction
  tenantAccountsLambda: IFunction
  stage: string
  userPool: IUserPool
  certificate: ICertificate
  hostedZone: IHostedZone
}

export class AccountApi {
  constructor(props: AccountApiProps) {
    this.createAccountApi(props)
  }

  private createAccountApi(props: AccountApiProps) {
    const {
      scope,
      accountsLambda,
      tenantAccountsLambda,
      stage,
      userPool,
      certificate,
      hostedZone,
    } = props

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

    accountsLambda.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com'))

    authorizer._attachToApi(api)

    api.root.addCorsPreflight(optionsWithCors)

    const secret = new Secret(scope, `${CONFIG.STACK_PREFIX}ApiSecret`, {
      generateSecretString: {
        generateStringKey: 'api_key',
        secretStringTemplate: JSON.stringify({username: 'web_user'}),
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
    })

    const apiKeyName = 'users-api-key'

    const apiKey = new ApiKey(scope, `${CONFIG.STACK_PREFIX}AccountsApiKey`, {
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
      name: `${CONFIG.STACK_PREFIX}AccountsApiUsagePlan`,
      apiStages: [apiStage],
      throttle: {burstLimit: 500, rateLimit: 1000},
      quota: {limit: 10000000, period: Period.MONTH},
    }

    const usagePlan = api.addUsagePlan(
      `${CONFIG.STACK_PREFIX}AccountsUsagePlan`,
      usagePlanProps,
    )
    usagePlan.addApiKey(apiKey)

    const root = api.root
    const usersRoot = root.addResource('users')
    const tenantsRoot = root.addResource('tenants')

    usersRoot
      .addResource('get-all-accounts')
      .addMethod('GET', new LambdaIntegration(accountsLambda), cognitoMethodOptions)

    usersRoot
      .addResource('create-account')
      .addMethod('POST', new LambdaIntegration(accountsLambda), cognitoMethodOptions)

    usersRoot
      .addResource('create-tenant-admin-account')
      .addMethod('POST', new LambdaIntegration(accountsLambda), apiKeyMethodOptions)

    const getAccountById = usersRoot.addResource('get-account-by-id')
    getAccountById
      .addResource('{id}')
      .addMethod('GET', new LambdaIntegration(accountsLambda), cognitoMethodOptions)

    const getAccountByEmail = usersRoot.addResource('get-account-by-email')
    getAccountByEmail
      .addResource('{emailAddress}')
      .addMethod('GET', new LambdaIntegration(accountsLambda), apiKeyMethodOptions)

    usersRoot
      .addResource('update-account')
      .addMethod('PUT', new LambdaIntegration(accountsLambda), cognitoMethodOptions)

    const deleteAccount = usersRoot.addResource('delete-account')

    deleteAccount
      .addResource('{id}')
      .addMethod('DELETE', new LambdaIntegration(accountsLambda), cognitoMethodOptions)

    ////////////////////////////////////////
    /////////////// TENANTS ////////////////
    ////////////////////////////////////////

    tenantsRoot
      .addResource('tenants/get-all-accounts')
      .addMethod('GET', new LambdaIntegration(tenantAccountsLambda), cognitoMethodOptions)

    tenantsRoot
      .addResource('tenants/create-account')
      .addMethod('POST', new LambdaIntegration(tenantAccountsLambda))

    tenantsRoot
      .addResource('tenants/create-tenant-admin-account')
      .addMethod('POST', new LambdaIntegration(tenantAccountsLambda), apiKeyMethodOptions)

    const getTenantAccountById = tenantsRoot.addResource('tenants/get-account-by-id')
    getTenantAccountById
      .addResource('{id}')
      .addMethod('GET', new LambdaIntegration(tenantAccountsLambda), cognitoMethodOptions)

    const getTenantAccountByEmail = tenantsRoot.addResource(
      'tenants/get-account-by-email',
    )
    getTenantAccountByEmail
      .addResource('{emailAddress}')
      .addMethod('GET', new LambdaIntegration(tenantAccountsLambda), apiKeyMethodOptions)

    tenantsRoot
      .addResource('tenants/update-account')
      .addMethod('PUT', new LambdaIntegration(tenantAccountsLambda), cognitoMethodOptions)

    const deleteTenantAccount = tenantsRoot.addResource('tenants/delete-account')

    deleteTenantAccount
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
