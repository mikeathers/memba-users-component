import {DynamoDB} from 'aws-sdk'

interface DeleteItemProps {
  id: string
  tableName: string
  dbClient: DynamoDB.DocumentClient
}

export const deleteItem = async (props: DeleteItemProps) => {
  const {id, tableName, dbClient} = props

  const params = {
    TableName: tableName,
    Key: {id},
    ReturnValues: 'ALL_OLD',
  }

  await dbClient.delete(params).promise()
}
