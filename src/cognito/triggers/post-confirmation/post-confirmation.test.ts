import {Context, PostConfirmationTriggerEvent} from 'aws-lambda'
import {handler} from './post-confirmation-entry'
import {mocked} from 'jest-mock'
import {addUserToGroup} from './add-user-to-group'

jest.mock('./add-user-to-group')

const mockAddUserToGroup = mocked(addUserToGroup)
const groupName = 'Users'
const userPoolId = '0000'
const username = 'test@test.com'

const defaultEvent: PostConfirmationTriggerEvent = {
  version: '',
  region: '',
  userPoolId,
  triggerSource: expect.anything(),
  userName: username,
  callerContext: {
    awsSdkVersion: '',
    clientId: '',
  },
  request: expect.anything(),
  response: expect.anything(),
}
const mockContext = {} as Context
const mockCallBack = jest.fn()

describe('Post Confirmation', () => {
  it('should call addUserToGroup', async () => {
    await handler(defaultEvent, mockContext, mockCallBack)
    expect(mockAddUserToGroup).toHaveBeenCalledWith({
      groupName,
      userPoolId,
      username,
    })
  })
})
