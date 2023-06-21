import {AttributeType, BillingMode, ITable, Table} from 'aws-cdk-lib/aws-dynamodb'
import {Construct} from 'constructs'
import CONFIG from '../config'
import {RemovalPolicy} from 'aws-cdk-lib'

export class Databases extends Construct {
  public readonly accountsTable: ITable

  constructor(scope: Construct, id: string, stage: string) {
    super(scope, id)

    this.accountsTable = this.createAccountsTable({scope: this, stage})
  }

  private createAccountsTable(props: {stage: string; scope: Construct}) {
    const {scope, stage} = props
    const tableName = CONFIG.STACK_PREFIX
    const accountsTable = new Table(scope, tableName, {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: tableName,
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    })

    accountsTable.addGlobalSecondaryIndex({
      indexName: 'authenticatedUserId',
      partitionKey: {
        name: 'authenticatedUserId',
        type: AttributeType.STRING,
      },
    })

    accountsTable.addGlobalSecondaryIndex({
      indexName: 'emailAddress',
      partitionKey: {
        name: 'emailAddress',
        type: AttributeType.STRING,
      },
    })

    return accountsTable
  }
}
