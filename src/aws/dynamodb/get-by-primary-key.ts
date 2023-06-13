import {DynamoDB} from 'aws-sdk'
import {AttributeMap} from 'aws-sdk/clients/dynamodb'

interface GetByPrimaryKeyProps {
  queryKey: string
  queryValue: string
  tableName: string
  dbClient: DynamoDB.DocumentClient
}

export const getByPrimaryKey = async (
  props: GetByPrimaryKeyProps,
): Promise<AttributeMap | undefined> => {
  const {queryKey, queryValue, tableName, dbClient} = props
  const params = {
    TableName: tableName,
    Key: {[queryKey]: queryValue},
  }

  console.log('PARAMS: ', params)

  const queryResponse = await dbClient.get(params).promise()

  console.log('QUERY RES: ', queryResponse)
  return queryResponse.Item
}
