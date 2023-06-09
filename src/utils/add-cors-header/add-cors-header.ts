import {APIGatewayProxyEvent} from 'aws-lambda'

export function addCorsHeader(result: APIGatewayProxyEvent): void {
  result.headers = {
    'Content-type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
  }
}
