import {DynamoDB} from 'aws-sdk'

interface AppendItemToListProps<T> {
  itemId: string
  itemToAppend: T
  itemNameToUpdate: string
  dbClient: DynamoDB.DocumentClient
  tableName: string
}
export const appendItemToList = async <T>(props: AppendItemToListProps<T>) => {
  const {tableName, itemNameToUpdate, itemId, itemToAppend, dbClient} = props
  const params = {
    TableName: tableName,
    Key: {id: itemId},
    ReturnValues: 'ALL_NEW',
    UpdateExpression: `set #${itemNameToUpdate} = list_append(if_not_exists(#${itemNameToUpdate}, :empty_list), :item)`,
    ExpressionAttributeNames: {
      '#markedLocations': 'markedLocations',
    },
    ExpressionAttributeValues: {
      ':item': [itemToAppend],
      ':empty_list': [],
    },
  }

  return await dbClient.update(params).promise()
}
