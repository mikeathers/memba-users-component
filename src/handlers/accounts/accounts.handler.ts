/* eslint-disable */
import {handleApiRequest} from './functions/handle-api-request'
import {createAccount} from './functions'
import {DynamoDB} from 'aws-sdk'

const dbClient = new DynamoDB.DocumentClient()

async function handler(event: any) {
  if (event['detail-type'] !== undefined) {
    if (event['source'] === 'Users' && event['detail-type'] === 'Create') {
      await createAccount({
        event,
        dbClient,
        authenticatedUserId: event.authenticatedUserId,
        eventType: 'eventBridge',
      })
    }
  }

  return await handleApiRequest(event, dbClient)
}

export {handler}
