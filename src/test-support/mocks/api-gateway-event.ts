import {APIGatewayEventIdentity, APIGatewayProxyEvent} from 'aws-lambda'

export const sampleAPIGatewayEvent: APIGatewayProxyEvent = {
  httpMethod: '',
  path: '/lambda',
  queryStringParameters: {
    query: '1234ABCD',
  },
  headers: {
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'accept-encoding': 'gzip',
    'accept-language': 'en-US,en;q=0.9',
    connection: 'keep-alive',
    host: 'lambda-alb-123578498.us-east-2.elb.amazonaws.com',
    'upgrade-insecure-requests': '1',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
    'x-amzn-trace-id': 'Root=1-5c536348-3d683b8b04734faae651f476',
    'x-forwarded-for': '72.12.164.125',
    'x-forwarded-port': '80',
    'x-forwarded-proto': 'http',
    'x-imforwards': '20',
  },
  body: '',
  isBase64Encoded: false,
  stageVariables: null,
  multiValueQueryStringParameters: null,
  multiValueHeaders: {test: ['test']},
  pathParameters: {test: 'test'},
  requestContext: {
    accountId: '',
    apiId: '',
    authorizer: {
      claims: {sub: '12345'},
    },
    protocol: '',
    httpMethod: '',
    identity: {} as APIGatewayEventIdentity,
    path: '',
    stage: '',
    requestId: '',
    requestTimeEpoch: 12345,
    resourceId: 'test',
    resourcePath: 'test',
  },
  resource: '',
}
