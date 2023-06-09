import {DynamoDB} from 'aws-sdk'
import {APIGatewayProxyEvent} from 'aws-lambda'

import {HttpStatusCode, QueryResult, UpdateAccountRequest} from '../../../../types'
import {getByPrimaryKey} from '../../../../aws'
import {publishUpdateAccountLogEvent} from '../../../../events'

interface UpdateAccountProps {
  event: APIGatewayProxyEvent
  dbClient: DynamoDB.DocumentClient
}

export const updateAccount = async (props: UpdateAccountProps): Promise<QueryResult> => {
  const tableName = process.env.TABLE_NAME ?? ''
  const {dbClient, event} = props

  if (event.body) {
    const updateAccountData = JSON.parse(event.body) as UpdateAccountRequest
    const {
      id,
      doorNumber,
      addressLineOne,
      addressLineTwo,
      townCity,
      postCode,
      firstName,
      lastName,
      emailAddress,
      tenantName,
    } = updateAccountData

    const accountExists = await getByPrimaryKey({
      queryKey: 'id',
      queryValue: id,
      tableName,
      dbClient,
    })

    if (!accountExists.Item) {
      return {
        body: {
          message: `Account with Id: ${id} does not exist and could not be updated.`,
        },
        statusCode: HttpStatusCode.BAD_REQUEST,
      }
    }

    const params = {
      TableName: tableName,
      Key: {id},
      UpdateExpression:
        'SET addressLineOne = :addressLineOne, addressLineTwo = :addressLineTwo, doorNumber = :doorNumber, townCity = :townCity, postCode = :postCode,' +
        ' lastName = :lastName, firstName = :firstName, emailAddress = :emailAddress, tenantName = :tenantName',
      ExpressionAttributeValues: {
        ':doorNumber': doorNumber,
        ':addressLineOne': addressLineOne,
        ':addressLineTwo': addressLineTwo,
        ':townCity': townCity,
        ':postCode': postCode,
        ':lastName': lastName,
        ':firstName': firstName,
        ':emailAddress': emailAddress,
        ':tenantName': tenantName,
      },
      ReturnValues: 'ALL_NEW',
    }

    const result = await dbClient.update(params).promise()

    await publishUpdateAccountLogEvent(updateAccountData)

    return {
      body: {
        message: 'Account updated successfully.',
        result,
      },
      statusCode: HttpStatusCode.OK,
    }
  }

  return {
    body: {
      message: 'Event has no body so account cannot be updated.',
    },
    statusCode: HttpStatusCode.INTERNAL_SERVER,
  }
}
