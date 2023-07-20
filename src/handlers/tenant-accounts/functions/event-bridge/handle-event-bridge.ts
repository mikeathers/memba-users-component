/* eslint-disable */
import {DocumentClient} from 'aws-sdk/clients/dynamodb'
import {createAccount} from './create-account'

export const handleEventBridge = async (event: any, dbClient: DocumentClient) => {
  if (event['source'] === 'Users' && event['detail-type'] === 'Create') {
    console.log('EVENT', event)
    await createAccount({
      event,
      dbClient,
    })
  }
}
