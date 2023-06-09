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
  private adminRole: Role
  private anonymousRole: Role
  private userRole: Role
  private readonly stage: string

  constructor(
    scope: Construct,
    userPool: UserPool,
    userPoolClient: UserPoolClient,
    stage: string,
  ) {
    this.scope = scope
    this.userPool = userPool
    this.userPoolClient = userPoolClient
    this.stage = stage

    this.identityPool = this.createIdentityPool()
    this.adminRole = this.createAdminCognitoGroupRole()
    this.anonymousRole = this.createAnonymousCognitoGroupRole()
    this.userRole = this.createUserCognitoGroupRole()
    this.createUserGroupsAndAttachRoles()
  }

  private createIdentityPool() {
    const identityPoolName = `${CONFIG.STACK_PREFIX}IdentityPool-${this.stage}`

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

  private createUserCognitoGroupRole() {
    const roleName = `${CONFIG.STACK_PREFIX}UserGroupRole`

    return new Role(this.scope, roleName, {
      roleName,
      description: 'Default role for authenticated users',
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
    const roleName = `${CONFIG.STACK_PREFIX}AnonymousGroupRole`

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

  private createAdminCognitoGroupRole() {
    const roleName = `${CONFIG.STACK_PREFIX}AdminsGroupRole`

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

  private createUserGroupsAndAttachRoles() {
    const usersGroupName = `Users`
    const adminsGroupName = `Admins`

    new CfnUserPoolGroup(this.scope, usersGroupName, {
      groupName: usersGroupName,
      userPoolId: this.userPool.userPoolId,
      description: 'The default group for authenticated users',
      precedence: 3,
      roleArn: this.userRole.roleArn,
    })

    new CfnUserPoolGroup(this.scope, adminsGroupName, {
      groupName: adminsGroupName,
      userPoolId: this.userPool.userPoolId,
      description: 'The group for admin users with specific privileges',
      precedence: 2,
      roleArn: this.adminRole.roleArn,
    })

    new CfnIdentityPoolRoleAttachment(this.scope, 'IdentityPoolRoleAttachment', {
      identityPoolId: this.identityPool.ref,
      roles: {
        authenticated: this.userRole.roleArn,
        unauthenticated: this.anonymousRole.roleArn,
      },
    })
  }
}
