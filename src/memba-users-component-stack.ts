import {Construct} from 'constructs'
import {CfnOutput, Stack, StackProps} from 'aws-cdk-lib'
import {
  IdentityPoolConstruct,
  UserPoolClientConstruct,
  UserPoolConstruct,
} from './cognito'

interface MembaUserComponentStackProps extends StackProps {
  stage: string
}
export class MembaUsersComponentStack extends Stack {
  constructor(scope: Construct, id: string, props: MembaUserComponentStackProps) {
    super(scope, id, props)
    const {stage} = props

    const {userPool} = new UserPoolConstruct(this, stage)
    const {userPoolClient} = new UserPoolClientConstruct(this, userPool, stage)
    const {identityPool} = new IdentityPoolConstruct(
      this,
      userPool,
      userPoolClient,
      stage,
    )

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

    new CfnOutput(this, 'Region', {
      value: Stack.of(this).region,
    })
  }
}
