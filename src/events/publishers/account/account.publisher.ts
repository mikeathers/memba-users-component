import {EventBridge} from 'aws-sdk'
import {
  CreateAccountEvent,
  CreateAccountLogEvent,
  DeleteAccountLogEvent,
  UpdateAccountLogEvent,
} from '../../events'
import {getEnv} from '../../../utils'

const eventBridge = new EventBridge()

const updateIdToAccountId = (
  event:
    | CreateAccountLogEvent
    | UpdateAccountLogEvent
    | DeleteAccountLogEvent
    | CreateAccountEvent,
) => {
  const accountId = event.id
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {id, ...rest} = event
  return {
    ...rest,
    accountId,
  }
}

export const publishCreateUserAccountEvent = async (
  requestDetails: CreateAccountEvent,
) => {
  const updatedEvent = updateIdToAccountId(requestDetails)
  const eventBusName = getEnv('EVENT_BUS_ARN')
  const params = {
    Entries: [
      {
        Source: 'Users',
        Detail: JSON.stringify(updatedEvent),
        DetailType: 'Create',
        Time: new Date(),
        EventBusName: eventBusName,
      },
    ],
  }

  await eventBridge.putEvents(params).promise()
}

export const publishCreateAccountLogEvent = async (
  requestDetails: CreateAccountLogEvent,
) => {
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

export const publishUpdateAccountLogEvent = async (
  requestDetails: UpdateAccountLogEvent,
) => {
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

export const publishDeleteAccountLogEvent = async (
  requestDetails: DeleteAccountLogEvent,
) => {
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
