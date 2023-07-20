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
  requestDetails: Omit<CreateAccountEvent, 'id' | 'password'>,
) => {
  const eventBusName = getEnv('EVENT_BUS_ARN')
  const params = {
    Entries: [
      {
        Source: 'Users',
        Detail: JSON.stringify(requestDetails),
        DetailType: 'Create',
        Time: new Date(),
        EventBusName: eventBusName,
      },
    ],
  }

  await eventBridge.putEvents(params).promise()
}

export const publishCreateLogEvent = async (
  requestDetails: Omit<CreateAccountLogEvent, 'password'>,
  source: string,
) => {
  const updatedEvent = updateIdToAccountId(requestDetails)
  const eventBusName = getEnv('EVENT_BUS_ARN')
  const params = {
    Entries: [
      {
        Source: source,
        Detail: JSON.stringify(updatedEvent),
        DetailType: 'Create',
        Time: new Date(),
        EventBusName: eventBusName,
      },
    ],
  }

  await eventBridge.putEvents(params).promise()
}

export const publishUpdateLogEvent = async (
  requestDetails: UpdateAccountLogEvent,
  source: string,
) => {
  const updatedEvent = updateIdToAccountId(requestDetails)
  const eventBusName = getEnv('EVENT_BUS_ARN')
  const params = {
    Entries: [
      {
        Source: source,
        Detail: JSON.stringify(updatedEvent),
        DetailType: 'Update',
        Time: new Date(),
        EventBusName: eventBusName,
      },
    ],
  }

  await eventBridge.putEvents(params).promise()
}

export const publishDeleteLogEvent = async (
  requestDetails: DeleteAccountLogEvent,
  source: string,
) => {
  const updatedEvent = updateIdToAccountId(requestDetails)
  const eventBusName = getEnv('EVENT_BUS_ARN')
  const params = {
    Entries: [
      {
        Source: source,
        Detail: JSON.stringify(updatedEvent),
        DetailType: 'Delete',
        Time: new Date(),
        EventBusName: eventBusName,
      },
    ],
  }

  await eventBridge.putEvents(params).promise()
}
