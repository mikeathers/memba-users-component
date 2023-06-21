import {Construct} from 'constructs'
import {
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment,
  CfnUserPoolGroup,
  UserPool,
  UserPoolClient,
} from 'aws-cdk-lib/aws-cognito'
import {FederatedPrincipal, ManagedPolicy, Role} from 'aws-cdk-lib/aws-iam'

import CONFIG from '../../config'

export class IdentityPoolConstruct {
  public identityPool: CfnIdentityPool
  private readonly scope: Construct
  private readonly userPool: UserPool
  private readonly userPoolClient: UserPoolClient
  private membaAdminRole: Role
  private anonymousRole: Role
  private tenantAdminRole: Role
  private usersRole: Role

  constructor(scope: Construct, userPool: UserPool, userPoolClient: UserPoolClient) {
    this.scope = scope
    this.userPool = userPool
    this.userPoolClient = userPoolClient

    this.identityPool = this.createIdentityPool()
    this.membaAdminRole = this.createMembaAdminCognitoGroupRole()
    this.anonymousRole = this.createAnonymousCognitoGroupRole()
    this.tenantAdminRole = this.createTenantAdminCognitoGroupRole()
    this.usersRole = this.createUsersCognitoGroupRole()
    this.createUserGroupsAndAttachRoles()
  }

  private createIdentityPool() {
    const identityPoolName = `${CONFIG.STACK_PREFIX}IdentityPool`

    return new CfnIdentityPool(this.scope, identityPoolName, {
      identityPoolName,
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
    })
  }
  private createTenantAdminCognitoGroupRole() {
    const roleName = `${CONFIG.STACK_PREFIX}-AdminGroupRole`

    return new Role(this.scope, roleName, {
      roleName,
      description: 'Default role for tenant admins',
      assumedBy: new FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonAPIGatewayInvokeFullAccess'),
      ],
    })
  }

  private createAnonymousCognitoGroupRole() {
    const roleName = `${CONFIG.STACK_PREFIX}-AnonymousGroupRole`

    return new Role(this.scope, roleName, {
      roleName,
      description: 'Default role for anonymous users',
      assumedBy: new FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonAPIGatewayInvokeFullAccess'),
      ],
    })
  }

  private createMembaAdminCognitoGroupRole() {
    const roleName = `${CONFIG.STACK_PREFIX}-MembaAdminsGroupRole`

    return new Role(this.scope, roleName, {
      roleName,
      description: 'Default role for administrator users',
      assumedBy: new FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonAPIGatewayInvokeFullAccess'),
      ],
    })
  }

  private createUsersCognitoGroupRole() {
    const roleName = `${CONFIG.STACK_PREFIX}-UsersGroupRole`

    return new Role(this.scope, roleName, {
      roleName,
      description: 'Default role for users',
      assumedBy: new FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonAPIGatewayInvokeFullAccess'),
      ],
    })
  }

  private createUserGroupsAndAttachRoles() {
    const tenantAdmins = 'TenantAdmins'
    const membaAdmins = 'MembaAdmins'

    new CfnUserPoolGroup(this.scope, tenantAdmins, {
      groupName: tenantAdmins,
      userPoolId: this.userPool.userPoolId,
      description: 'The group for tenant administrators',
      precedence: 3,
      roleArn: this.tenantAdminRole.roleArn,
    })

    new CfnUserPoolGroup(this.scope, membaAdmins, {
      groupName: membaAdmins,
      userPoolId: this.userPool.userPoolId,
      description: 'The group for memba admins with specific privileges',
      precedence: 2,
      roleArn: this.membaAdminRole.roleArn,
    })

    new CfnIdentityPoolRoleAttachment(this.scope, 'IdentityPoolRoleAttachment', {
      identityPoolId: this.identityPool.ref,
      roles: {
        authenticated: this.tenantAdminRole.roleArn,
        unauthenticated: this.anonymousRole.roleArn,
      },
    })
  }
}
