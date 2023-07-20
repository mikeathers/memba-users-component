import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client'
import {v4 as uuidv4} from 'uuid'
import {HttpStatusCode} from '../../types'
import {getByPrimaryKey} from '../../aws'
import {mocked} from 'jest-mock'
import AWS, {DynamoDB} from 'aws-sdk'

import {queryBySecondaryKey} from '../../aws'
import {createTenantUser} from '../../aws/cognito'
import {sampleAPIGatewayEvent, sampleEventBridgeEvent} from '../../test-support'
import {
  publishCreateLogEvent,
  publishUpdateLogEvent,
  publishDeleteLogEvent,
} from '../../events'
import {addCorsHeader} from '../../utils'
import {createTenant} from './functions/api/create-tenant'

import AttributeValue = DocumentClient.AttributeValue

jest.mock('../../aws')
jest.mock('uuid')
jest.mock('../../events')
jest.mock('../../utils')
jest.mock('../../aws/cognito')
jest.mock('./functions/api/create-tenant')

const mockAddCorsHeader = mocked(addCorsHeader)
const mockGetByPrimaryKey = mocked(getByPrimaryKey)
const mockQueryBySecondaryKey = mocked(queryBySecondaryKey)
const mockPublishCreateAccountLogEvent = mocked(publishCreateLogEvent)
const mockPublishUpdateAccountLogEvent = mocked(publishUpdateLogEvent)
const mockPublishDeleteAccountLogEvent = mocked(publishDeleteLogEvent)
const mockUuid = mocked(uuidv4)
const mockedScan = jest.fn()
const mockedPut = jest.fn()
const mockedUpdate = jest.fn()
const mockedDelete = jest.fn()
const mockUuidResult = '8f9e060d-3028-411a-9a00-d3b00966638b'
const mockCreateTenantUser = mocked(createTenantUser)
const mockCreateTenant = mocked(createTenant)

jest.doMock('aws-sdk', () => ({
  EventBridge: jest.fn(),
  CognitoIdentityServiceProvider: jest.fn(),
  DynamoDB: {
    DocumentClient: jest.fn(() => {
      return {
        scan: mockedScan,
        put: mockedPut,
        update: mockedUpdate,
        delete: mockedDelete,
      }
    }),
  },
}))

import {handler} from './tenant-accounts.handler'

const body = {
  townCity: 'Liverpool',
  lastName: 'Bloggs',
  firstName: 'Joe',
  addressLineOne: 'First Street',
  emailAddress: 'joebloggs@gmail.com',
  postCode: 'L1 2HK',
  doorNumber: '12',
  tenantName: 'test-tenant',
  tenantUrl: 'test-tenant.memba.co.uk',
  tenantId: '1234',
}
const apiResult = {
  ...body,
  id: mockUuidResult,
  isTenantAdmin: true,
  authenticatedUserId: '12345',
}

const detail = {
  authenticatedUserId: '4148b339-319c-426f-8e1f-a9eabe018cc6',
  addressLineOne: 'Test Street',
  addressLineTwo: 'Buckingham',
  doorNumber: '1',
  townCity: 'Birmingham',
  postCode: 'BL1 6HY',
  firstName: 'Mike',
  lastName: 'Atherton',
  emailAddress: 'test@test.com',
  tenantName: 'test-tenant',
  tenantUrl: 'test-tenant.memba.co.uk',
}

const eventBridgeResult = {
  ...detail,
  id: mockUuidResult,
}

describe('Account handler', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockCreateTenant.mockResolvedValue({
      statusText: '',
      headers: {},
      config: expect.anything(),
      status: 200,
      data: {id: '1234', admins: [], apps: []},
    })
    process.env.TABLE_NAME = 'Users-Dev'
  })

  describe('Handler', () => {
    describe('EventBridge Event', () => {
      describe('Create Account', () => {
        it('should call db put with account details', async () => {
          mockQueryBySecondaryKey.mockResolvedValue([])
          mockUuid.mockReturnValue(mockUuidResult)
          mockedPut.mockImplementation(() => {
            return {
              promise: () => ({
                Item: apiResult,
              }),
            }
          })

          await handler({
            ...sampleEventBridgeEvent,
            'detail-type': 'Create',
            source: 'Users',
            detail,
          })

          expect(mockedPut).toHaveBeenCalledWith({
            TableName: 'Users-Dev',
            Item: eventBridgeResult,
          })
        })

        it('should call publishCreateAccountLogEvent if event created successfully', async () => {
          mockQueryBySecondaryKey.mockResolvedValue([])
          mockUuid.mockReturnValue(mockUuidResult)
          mockedPut.mockImplementation(() => {
            return {
              promise: () => ({
                Item: apiResult,
              }),
            }
          })

          await handler({
            ...sampleEventBridgeEvent,
            'detail-type': 'Create',
            source: 'Users',
            detail,
          })

          expect(mockPublishCreateAccountLogEvent).toHaveBeenCalledWith(
            eventBridgeResult,
            'TenantAccountEventLog',
          )
        })

        it('should throw an error if account already exists', async () => {
          mockQueryBySecondaryKey.mockResolvedValue([{Item: apiResult} as AttributeValue])
          mockUuid.mockReturnValue(mockUuidResult)

          try {
            await handler({
              ...sampleEventBridgeEvent,
              'detail-type': 'Create',
              source: 'Users',
              detail,
            })
          } catch (err) {
            expect((err as Error).message).toEqual(
              `Account details already exist for the authenticated user. ID: ${eventBridgeResult.authenticatedUserId}`,
            )
          }
        })

        it('should throw an error if event has no details', async () => {
          mockGetByPrimaryKey.mockResolvedValue({Item: undefined})
          try {
            await handler({
              ...sampleEventBridgeEvent,
              'detail-type': 'Create',
              source: 'Users',
              detail: null,
            })
          } catch (err) {
            expect((err as Error).message).toEqual(`Event body is missing details`)
          }
        })
      })
    })

    describe('API Event', () => {
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
          Item: apiResult as DynamoDB.DocumentClient.AttributeValue,
        })
        await expect(
          handler({
            ...sampleAPIGatewayEvent,
            httpMethod: 'GET',
            pathParameters: {id: '1234'},
          }),
        ).resolves.toEqual({
          statusCode: HttpStatusCode.OK,
          body: JSON.stringify({message: 'Account has been found.', result: apiResult}),
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

    describe('GET getAccountByEmail', () => {
      it('should return a 200 (OK) if the account is found with the provided email address', async () => {
        mockQueryBySecondaryKey.mockResolvedValue([{Item: apiResult} as AttributeValue])
        await expect(
          handler({
            ...sampleAPIGatewayEvent,
            httpMethod: 'GET',
            pathParameters: {emailAddress: 'joe@gmail.com'},
          }),
        ).resolves.toEqual({
          statusCode: HttpStatusCode.OK,
          body: JSON.stringify({
            message: 'Account has been found.',
            result: {Item: {...apiResult}},
          }),
        })
      })

      it('should return a 400 (Bad Request) if the account is not found using the provided email address', async () => {
        const emailAddress = 'joe@gmail.com'
        mockGetByPrimaryKey.mockResolvedValue({})
        await expect(
          handler({
            ...sampleAPIGatewayEvent,
            httpMethod: 'GET',
            pathParameters: {emailAddress},
          }),
        ).resolves.toEqual({
          statusCode: HttpStatusCode.BAD_REQUEST,
          body: JSON.stringify({
            message: `Account with email: ${emailAddress} does not exist.`,
          }),
        })
      })
    })

    describe('GET allAccounts', () => {
      it('should return a 200 (OK) if accounts are found', async () => {
        mockedScan.mockImplementation(() => {
          return {
            promise: () => ({
              Items: [apiResult, apiResult, apiResult],
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
          body: JSON.stringify({result: [apiResult, apiResult, apiResult]}),
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
        mockCreateTenantUser.mockReturnValue(
          Promise.resolve({...expect.anything(), UserSub: '12345'}),
        )
        mockUuid.mockReturnValue(mockUuidResult)
        mockedPut.mockImplementation(() => {
          return {
            promise: () => ({
              Item: apiResult,
            }),
          }
        })

        await expect(
          handler({
            ...sampleAPIGatewayEvent,
            httpMethod: 'POST',
            pathParameters: null,
            body: JSON.stringify(body),
            path: '/create-account',
          }),
        ).resolves.toEqual({
          statusCode: HttpStatusCode.CREATED,
          body: JSON.stringify({
            message: 'Account created successfully!',
            result: apiResult,
          }),
        })
      })

      it('should call publishCreateAccountLogEvent if event created successfully', async () => {
        mockQueryBySecondaryKey.mockResolvedValue([])
        mockCreateTenantUser.mockReturnValue(
          Promise.resolve({...expect.anything(), UserSub: '12345'}),
        )
        mockUuid.mockReturnValue(mockUuidResult)
        mockedPut.mockImplementation(() => {
          return {
            promise: () => ({
              Item: apiResult,
            }),
          }
        })

        await handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'POST',
          pathParameters: null,
          body: JSON.stringify(body),
          path: '/create-account',
        })

        expect(mockPublishCreateAccountLogEvent).toHaveBeenCalledWith(
          apiResult,
          'TenantAccountEventLog',
        )
      })

      it('should return a 400 (Bad Request) if account already exists', async () => {
        mockQueryBySecondaryKey.mockResolvedValue([{Item: apiResult} as AttributeValue])
        mockCreateTenantUser.mockReturnValue(
          Promise.resolve({...expect.anything(), UserSub: '12345'}),
        )
        mockUuid.mockReturnValue(mockUuidResult)
        await expect(
          handler({
            ...sampleAPIGatewayEvent,
            httpMethod: 'POST',
            pathParameters: null,
            body: JSON.stringify(body),
            path: '/create-account',
          }),
        ).resolves.toEqual({
          statusCode: HttpStatusCode.BAD_REQUEST,
          body: JSON.stringify({
            message: `An account already exists with the details you have provided.`,
          }),
        })
      })

      it('should return a 500 (Internal Server Error) if event has not body', async () => {
        mockGetByPrimaryKey.mockResolvedValue({Item: undefined})
        await expect(
          handler({
            ...sampleAPIGatewayEvent,
            httpMethod: 'POST',
            pathParameters: null,
            body: null,
            path: '/create-account',
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
        isTenantAdmin: true,
      }

      it('should return a 200 (OK) if account is updated', async () => {
        mockGetByPrimaryKey.mockResolvedValue({
          Item: apiResult as AWS.DynamoDB.DocumentClient.AttributeValue,
        })
        mockedUpdate.mockImplementation(() => {
          return {
            promise: () => ({
              Item: apiResult,
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
            result: {Item: apiResult},
          }),
        })
      })

      it('should call publishUpdateAccountEvent if account updated successfully', async () => {
        mockGetByPrimaryKey.mockResolvedValue({
          Item: apiResult as AWS.DynamoDB.DocumentClient.AttributeValue,
        })
        mockedUpdate.mockImplementation(() => {
          return {
            promise: () => ({
              Item: apiResult,
            }),
          }
        })

        await handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'PUT',
          pathParameters: null,
          body: JSON.stringify(accountToUpdate),
        })

        expect(mockPublishUpdateAccountLogEvent).toHaveBeenCalledWith(
          apiResult,
          'TenantAccountEventLog',
        )
      })

      it('should return a 400 (Bad Request) if account to update does not exist', async () => {
        mockGetByPrimaryKey.mockResolvedValue({Item: undefined})

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
        mockGetByPrimaryKey.mockResolvedValue({Item: undefined})

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
              Attributes: apiResult,
            }),
          }
        })

        await expect(
          handler({
            ...sampleAPIGatewayEvent,
            httpMethod: 'DELETE',
            pathParameters: {id: apiResult.id},
            body: JSON.stringify(accountToDelete),
          }),
        ).resolves.toEqual({
          statusCode: HttpStatusCode.OK,
          body: JSON.stringify({
            message: `Account ${accountToDelete.id} has been deleted successfully.`,
            result: {Attributes: apiResult},
          }),
        })
      })

      it('should publish publishDeleteAccountEvent when account gets deleted', async () => {
        mockQueryBySecondaryKey.mockResolvedValue([{Item: apiResult} as AttributeValue])
        mockedDelete.mockImplementation(() => {
          return {
            promise: () => ({
              Attributes: apiResult,
            }),
          }
        })

        await handler({
          ...sampleAPIGatewayEvent,
          httpMethod: 'DELETE',
          pathParameters: {id: apiResult.id},
          body: JSON.stringify(accountToDelete),
        })

        expect(mockPublishDeleteAccountLogEvent).toHaveBeenCalledWith(
          {
            id: accountToDelete.id,
            userWhoDeletedAccountId: accountToDelete.authenticatedUserId,
          },
          'TenantAccountEventLog',
        )
      })

      it('should return a 400 (Bad Request) if the account has been found but not deleted', async () => {
        mockQueryBySecondaryKey.mockResolvedValue([{Item: apiResult} as AttributeValue])
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
        mockQueryBySecondaryKey.mockResolvedValue([{Item: apiResult} as AttributeValue])
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
            pathParameters: {id: apiResult.id},
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
})