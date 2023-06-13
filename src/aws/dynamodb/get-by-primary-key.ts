import {DynamoDB} from 'aws-sdk'
import {AttributeMap, GetItemOutput} from 'aws-sdk/clients/dynamodb'

interface GetByPrimaryKeyProps {
  queryKey: string
  queryValue: string
  tableName: string
  dbClient: DynamoDB.DocumentClient
}

export const getByPrimaryKey = async (
  props: GetByPrimaryKeyProps,
): Promise<GetItemOutput> => {
  const {queryKey, queryValue, tableName, dbClient} = props
  const params = {
    TableName: tableName,
    Key: {[queryKey]: queryValue},
  }

  return await dbClient.get(params).promise()
}
