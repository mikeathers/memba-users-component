import {EventBridge} from 'aws-sdk'
import {CreateAccountEvent, DeleteAccountEvent, UpdateAccountEvent} from '../../events'
import {getEnv} from '../../../utils'

const eventBridge = new EventBridge()

const updateIdToAccountId = (
  event: CreateAccountEvent | UpdateAccountEvent | DeleteAccountEvent,
) => {
  const accountId = event.id
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {id, ...rest} = event
  return {
    ...rest,
    accountId,
  }
}

export const publishCreateAccountEvent = async (requestDetails: CreateAccountEvent) => {
  const updatedEvent = updateIdToAccountId(requestDetails)
  const eventBusName = getEnv('EVENT_BUS_ARN')
  const params = {
    Entries: [
      {
        Source: 'AccountEventLog',
        Detail: JSON.stringify(updatedEvent),
        DetailType: 'Create',
        Time: new Date(),
        EventBusName: eventBusName,
      },
    ],
  }

  await eventBridge.putEvents(params).promise()
}

export const publishUpdateAccountEvent = async (requestDetails: UpdateAccountEvent) => {
  const updatedEvent = updateIdToAccountId(requestDetails)
  const eventBusName = getEnv('EVENT_BUS_ARN')
  const params = {
    Entries: [
      {
        Source: 'AccountEventLog',
        Detail: JSON.stringify(updatedEvent),
        DetailType: 'Update',
        Time: new Date(),
        EventBusName: eventBusName,
      },
    ],
  }

  await eventBridge.putEvents(params).promise()
}

export const publishDeleteAccountEvent = async (requestDetails: DeleteAccountEvent) => {
  const updatedEvent = updateIdToAccountId(requestDetails)
  const eventBusName = getEnv('EVENT_BUS_ARN')
  const params = {
    Entries: [
      {
        Source: 'AccountEventLog',
        Detail: JSON.stringify(updatedEvent),
        DetailType: 'Delete',
        Time: new Date(),
        EventBusName: eventBusName,
      },
    ],
  }

  await eventBridge.putEvents(params).promise()
}
