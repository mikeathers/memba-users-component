import {APIGatewayProxyEvent} from 'aws-lambda'

export function addCorsHeader() {
  return {
    'Content-type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
  }
}
