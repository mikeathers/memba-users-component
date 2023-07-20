/* eslint-disable */
import {DynamoDB} from 'aws-sdk'
import {handleApiRequest, handleEventBridge} from './functions'

const dbClient = new DynamoDB.DocumentClient()

async function handler(event: any) {
  if (event['detail-type'] !== undefined) {
    return await handleEventBridge(event, dbClient)
  }

  return await handleApiRequest(event, dbClient)
}

export {handler}
