import {DocumentClient} from 'aws-sdk/clients/dynamodb'
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'

import {HttpStatusCode} from '../../../../types'
import {addCorsHeader, errorHasMessage} from '../../../../utils'
import {getAccountById} from './get-account-by-id'
import {getAllAccounts} from './get-all-accounts'
import {createAccount} from './create-account'
import {updateAccount} from './update-account'
import {deleteAccount} from './delete-account'
import {getAccountByEmail} from './get-account-by-email'

export const handleApiRequest = async (
  event: APIGatewayProxyEvent,
  dbClient: DocumentClient,
) => {
  console.log('request:', JSON.stringify(event, null, 2))

  const result: APIGatewayProxyResult = {
    statusCode: HttpStatusCode.OK,
    body: '',
    headers: addCorsHeader(),
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const authenticatedUserId = event.requestContext.authorizer?.claims['sub'] as string

    switch (event.httpMethod) {
      case 'GET':
        if (event.pathParameters?.id) {
          const response = await getAccountById({id: event.pathParameters.id, dbClient})
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        } else if (event.pathParameters?.emailAddress) {
          const response = await getAccountByEmail({
            emailAddress: event.pathParameters.emailAddress,
            dbClient,
          })
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        } else {
          const response = await getAllAccounts({dbClient})
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        }
        break
      case 'POST': {
        if (event.path.includes('create-account')) {
          const response = await createAccount({
            event,
            dbClient,
          })
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        }
        break
      }
      case 'PUT': {
        const response = await updateAccount({event, dbClient})
        result.body = JSON.stringify(response.body)
        result.statusCode = response.statusCode
        break
      }
      case 'DELETE': {
        const response = await deleteAccount({
          dbClient,
          id: event.pathParameters?.id,
          authenticatedUserId,
        })
        result.body = JSON.stringify(response.body)
        result.statusCode = response.statusCode
        break
      }
      default:
        throw new Error(`Unsupported route: "${event.httpMethod}"`)
    }
  } catch (err) {
    console.error(err)
    result.statusCode = 500

    if (errorHasMessage(err)) result.body = err.message
    else result.body = 'Something went very wrong.'
  }
  return result
}
