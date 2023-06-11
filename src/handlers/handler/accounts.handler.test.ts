import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client'
import {v4 as uuidv4} from 'uuid'
import {HttpStatusCode} from '../../types'
import {getByPrimaryKey} from '../../aws'
import {mocked} from 'jest-mock'
import AWS, {DynamoDB} from 'aws-sdk'

import {queryBySecondaryKey} from '../../aws'
import {sampleAPIGatewayEvent} from '../../test-support'
import {
  publishCreateAccountEvent,
  publishUpdateAccountEvent,
  publishDeleteAccountEvent,
} from '../../events'
import {addCorsHeader} from '../../utils'

import AttributeValue = DocumentClient.AttributeValue

jest.mock('../../../aws')
jest.mock('uuid')
jest.mock('../../../events')
jest.mock('../../../utils')

const mockAddCorsHeader = mocked(addCorsHeader)
const mockGetByPrimaryKey = mocked(getByPrimaryKey)
const mockQueryBySecondaryKey = mocked(queryBySecondaryKey)
const mockPublishCreateAccountEvent = mocked(publishCreateAccountEvent)
const mockPublishUpdateAccountEvent = mocked(publishUpdateAccountEvent)
const mockPublishDeleteAccountEvent = mocked(publishDeleteAccountEvent)
const mockUuid = mocked(uuidv4)
const mockedScan = jest.fn()
const mockedPut = jest.fn()
const mockedUpdate = jest.fn()
const mockedDelete = jest.fn()

let optionsUsedToConstructDocumentClient: DynamoDB.Types.ClientConfiguration

jest.doMock('aws-sdk', () => ({
  EventBridge: jest.fn(),
  DynamoDB: {
    DocumentClient: jest.fn((options) => {
      optionsUsedToConstructDocumentClient = {...options}

      return {
        scan: mockedScan,
        put: mockedPut,
        update: mockedUpdate,
        delete: mockedDelete,
      }
    }),
  },
}))

import {handler} from '../index'

const result = {
  townCity: 'Liverpool',
  lastName: 'Bloggs',
  firstName: 'Joe',
  addressLineOne: 'First Street',
  emailAddress: 'joebloggs@gmail.com',
  postCode: 'L1 2HK',
  doorNumber: '12',
  id: '8f9e060d-3028-411a-9a00-d3b00966638b',
  authenticatedUserId: '12345',
}

const body = {
  townCity: 'Liverpool',
  lastName: 'Bloggs',
  firstName: 'Joe',
  addressLineOne: 'First Street',
  emailAddress: 'joebloggs@gmail.com',
  postCode: 'L1 2HK',
  doorNumber: '12',
}

describe('Account handler', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    process.env.TABLE_NAME = 'Accounts-Dev'
    process.env.EVENT_BUS_ARN = 'test-event-bus'
  })

  describe('Handler', () => {
    it('should call addCorsHeader', async () => {
      await handler({
        ...sampleAPIGatewayEvent,
        httpMethod: 'GET',
        pathParameters: {id: '1234'},
      })

      expect(mockAddCorsHeader).toHaveBeenCalled()
    })

    it('should throw error when unsupported route found', async () => {
      try {
        await handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'POP',
          pathParameters: {id: '1234'},
        })
      } catch (err) {
        expect((err as Error).message).toBe('Unsupported route: "POP"')
      }
    })
  })

  describe('GET getAccountById', () => {
    it('should return a 200 (OK) if the account is found with the provided id', async () => {
      mockGetByPrimaryKey.mockResolvedValue({
        Item: result as DynamoDB.DocumentClient.AttributeValue,
      })
      await expect(
        handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'GET',
          pathParameters: {id: '1234'},
        }),
      ).resolves.toEqual({
        statusCode: HttpStatusCode.OK,
        body: JSON.stringify({message: 'Account has been found.', result}),
      })
    })

    it('should return a 400 (Bad Request) if the account is not found using the provided id', async () => {
      const id = '1234'
      mockGetByPrimaryKey.mockResolvedValue({})
      await expect(
        handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'GET',
          pathParameters: {id},
        }),
      ).resolves.toEqual({
        statusCode: HttpStatusCode.BAD_REQUEST,
        body: JSON.stringify({message: `Account with Id: ${id} does not exist.`}),
      })
    })
  })

  describe('GET allAccounts', () => {
    it('should return a 200 (OK) if accounts are found', async () => {
      mockedScan.mockImplementation(() => {
        return {
          promise: () => ({
            Items: [result, result, result],
          }),
        }
      })

      await expect(
        handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'GET',
          pathParameters: null,
        }),
      ).resolves.toEqual({
        statusCode: HttpStatusCode.OK,
        body: JSON.stringify({result: [result, result, result]}),
      })
    })

    it('should return a 200 (OK) if no results are found', async () => {
      mockedScan.mockImplementation(() => {
        return {
          promise: () => ({
            Items: [],
          }),
        }
      })
      await expect(
        handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'GET',
          pathParameters: null,
        }),
      ).resolves.toEqual({
        statusCode: HttpStatusCode.OK,
        body: JSON.stringify({result: []}),
      })
    })
  })

  describe('POST createAccount', () => {
    it('should return a 200 (OK) if account is created', async () => {
      mockQueryBySecondaryKey.mockResolvedValue([])
      mockUuid.mockReturnValue('8f9e060d-3028-411a-9a00-d3b00966638b')
      mockedPut.mockImplementation(() => {
        return {
          promise: () => ({
            Item: result,
          }),
        }
      })

      await expect(
        handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'POST',
          pathParameters: null,
          body: JSON.stringify(body),
        }),
      ).resolves.toEqual({
        statusCode: HttpStatusCode.CREATED,
        body: JSON.stringify({
          message: 'Account created successfully!',
          result,
        }),
      })
    })

    it('should call publishCreateAccountEvent if event created successfully', async () => {
      mockQueryBySecondaryKey.mockResolvedValue([])
      mockUuid.mockReturnValue('8f9e060d-3028-411a-9a00-d3b00966638b')
      mockedPut.mockImplementation(() => {
        return {
          promise: () => ({
            Item: result,
          }),
        }
      })

      await handler({
        ...sampleAPIGatewayEvent,
        httpMethod: 'POST',
        pathParameters: null,
        body: JSON.stringify(body),
      })

      expect(mockPublishCreateAccountEvent).toHaveBeenCalledWith(result)
    })

    it('should return a 400 (Bad Request) if account already exists', async () => {
      mockQueryBySecondaryKey.mockResolvedValue([{Item: result} as AttributeValue])
      mockUuid.mockReturnValue('8f9e060d-3028-411a-9a00-d3b00966638b')
      await expect(
        handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'POST',
          pathParameters: null,
          body: JSON.stringify(body),
        }),
      ).resolves.toEqual({
        statusCode: HttpStatusCode.BAD_REQUEST,
        body: JSON.stringify({
          message: `Account details already exist for the authenticated user.`,
        }),
      })
    })

    it('should return a 500 (Internal Server Error) if event has not body', async () => {
      mockGetByPrimaryKey.mockResolvedValue(undefined)
      await expect(
        handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'POST',
          pathParameters: null,
          body: null,
        }),
      ).resolves.toEqual({
        statusCode: HttpStatusCode.INTERNAL_SERVER,
        body: JSON.stringify({
          message: `The event is missing a body and cannot be parsed.`,
        }),
      })
    })
  })

  describe('PUT updateAccount', () => {
    const accountToUpdate = {
      ...body,
      id: '8f9e060d-3028-411a-9a00-d3b00966638b',
      authenticatedUserId: '12345',
    }

    it('should return a 200 (OK) if account is updated', async () => {
      mockGetByPrimaryKey.mockResolvedValue({
        Item: result as AWS.DynamoDB.DocumentClient.AttributeValue,
      })
      mockedUpdate.mockImplementation(() => {
        return {
          promise: () => ({
            Item: result,
          }),
        }
      })

      await expect(
        handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'PUT',
          pathParameters: null,
          body: JSON.stringify(accountToUpdate),
        }),
      ).resolves.toEqual({
        statusCode: HttpStatusCode.OK,
        body: JSON.stringify({
          message: 'Account updated successfully.',
          result: {Item: result},
        }),
      })
    })

    it('should call publishUpdateAccountEvent if account updated successfully', async () => {
      mockGetByPrimaryKey.mockResolvedValue({
        Item: result as AWS.DynamoDB.DocumentClient.AttributeValue,
      })
      mockedUpdate.mockImplementation(() => {
        return {
          promise: () => ({
            Item: result,
          }),
        }
      })

      await handler({
        ...sampleAPIGatewayEvent,
        httpMethod: 'PUT',
        pathParameters: null,
        body: JSON.stringify(accountToUpdate),
      })

      expect(mockPublishUpdateAccountEvent).toHaveBeenCalledWith(result)
    })

    it('should return a 400 (Bad Request) if account to update does not exist', async () => {
      mockGetByPrimaryKey.mockResolvedValue(undefined)

      await expect(
        handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'PUT',
          pathParameters: null,
          body: JSON.stringify(accountToUpdate),
        }),
      ).resolves.toEqual({
        statusCode: HttpStatusCode.BAD_REQUEST,
        body: JSON.stringify({
          message: `Account with Id: ${accountToUpdate.id} does not exist and could not be updated.`,
        }),
      })
    })

    it('should return a 500 (Internal Server Error) if event has not body', async () => {
      mockGetByPrimaryKey.mockResolvedValue(undefined)

      await expect(
        handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'PUT',
          pathParameters: null,
          body: null,
        }),
      ).resolves.toEqual({
        statusCode: HttpStatusCode.INTERNAL_SERVER,
        body: JSON.stringify({
          message: `Event has no body so account cannot be updated.`,
        }),
      })
    })
  })

  describe('DELETE deleteAccount', () => {
    const accountToDelete = {
      ...body,
      id: '8f9e060d-3028-411a-9a00-d3b00966638b',
      authenticatedUserId: '12345',
    }

    it('should return a 200 (OK) if account is deleted', async () => {
      mockedDelete.mockImplementation(() => {
        return {
          promise: () => ({
            Attributes: result,
          }),
        }
      })

      await expect(
        handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'DELETE',
          pathParameters: {id: result.id},
          body: JSON.stringify(accountToDelete),
        }),
      ).resolves.toEqual({
        statusCode: HttpStatusCode.OK,
        body: JSON.stringify({
          message: `Account ${accountToDelete.id} has been deleted successfully.`,
          result: {Attributes: result},
        }),
      })
    })

    it('should publish publishDeleteAccountEvent when account gets deleted', async () => {
      mockQueryBySecondaryKey.mockResolvedValue([{Item: result} as AttributeValue])
      mockedDelete.mockImplementation(() => {
        return {
          promise: () => ({
            Attributes: result,
          }),
        }
      })

      await handler({
        ...sampleAPIGatewayEvent,
        httpMethod: 'DELETE',
        pathParameters: {id: result.id},
        body: JSON.stringify(accountToDelete),
      })

      expect(mockPublishDeleteAccountEvent).toHaveBeenCalledWith({
        id: accountToDelete.id,
        userWhoDeletedAccountId: accountToDelete.authenticatedUserId,
      })
    })

    it('should return a 400 (Bad Request) if the account has been found but not deleted', async () => {
      mockQueryBySecondaryKey.mockResolvedValue([{Item: result} as AttributeValue])
      mockedDelete.mockImplementation(() => {
        return {
          promise: () => ({
            Attributes: null,
          }),
        }
      })

      await expect(
        handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'DELETE',
          pathParameters: {id: accountToDelete.id},
          body: JSON.stringify(accountToDelete),
        }),
      ).resolves.toEqual({
        statusCode: HttpStatusCode.BAD_REQUEST,
        body: JSON.stringify({
          message: `Account ${accountToDelete.id} could not be deleted at this time.`,
        }),
      })
    })

    it('should return a 400 (Bad Request) if no account id was provided', async () => {
      mockQueryBySecondaryKey.mockResolvedValue([{Item: result} as AttributeValue])
      await expect(
        handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'DELETE',
          pathParameters: null,
          body: JSON.stringify(accountToDelete),
        }),
      ).resolves.toEqual({
        statusCode: HttpStatusCode.BAD_REQUEST,
        body: JSON.stringify({
          message: `An Account Id was missing from the request..`,
        }),
      })
    })

    it('should return a 400 (Bad Request) if account to delete does not exist', async () => {
      mockQueryBySecondaryKey.mockResolvedValue([])
      await expect(
        handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'DELETE',
          pathParameters: {id: result.id},
          body: JSON.stringify(accountToDelete),
        }),
      ).resolves.toEqual({
        statusCode: HttpStatusCode.BAD_REQUEST,
        body: JSON.stringify({
          message: `Account ${accountToDelete.id} was not deleted because it does not exist.`,
        }),
      })
    })
  })
})
