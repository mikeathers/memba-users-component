import {DynamoDB} from 'aws-sdk'
import {APIGatewayProxyEvent} from 'aws-lambda'

import {HttpStatusCode, QueryResult, UpdateAccountRequest} from '../../../../types'
import {getByPrimaryKey} from '../../../../aws'
import {publishUpdateLogEvent} from '../../../../events'

interface UpdateAccountProps {
  event: APIGatewayProxyEvent
  dbClient: DynamoDB.DocumentClient
}

export const updateAccount = async (props: UpdateAccountProps): Promise<QueryResult> => {
  const tableName = process.env.TABLE_NAME ?? ''
  const {dbClient, event} = props

  if (event.body) {
    const updateAccountData = JSON.parse(event.body) as UpdateAccountRequest
    const {id, firstName, lastName, emailAddress, appName} = updateAccountData

    const accountExists = await getByPrimaryKey({
      queryKey: 'id',
      queryValue: id,
      tableName,
      dbClient,
    })

    if (!accountExists.Item) {
      return {
        body: `Account with Id: ${id} does not exist and could not be updated.`,
        statusCode: HttpStatusCode.BAD_REQUEST,
      }
    }

    const params = {
      TableName: tableName,
      Key: {id},
      UpdateExpression:
        'SET lastName = :lastName, firstName = :firstName, emailAddress = :emailAddress, appName = :appName',
      ExpressionAttributeValues: {
        ':lastName': lastName,
        ':firstName': firstName,
        ':emailAddress': emailAddress,
        ':appName': appName,
      },
      ReturnValues: 'ALL_NEW',
    }

    const result = await dbClient.update(params).promise()

    await publishUpdateLogEvent(updateAccountData, 'TenantAccountEventLog')

    return {
      body: result,
      statusCode: HttpStatusCode.OK,
    }
  }

  return {
    body: 'Event has no body so account cannot be updated.',
    statusCode: HttpStatusCode.INTERNAL_SERVER,
  }
}
