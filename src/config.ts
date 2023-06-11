interface ConfigProps {
  STACK_PREFIX: string
  REGION: string
  AWS_ACCOUNT_ID_PROD: string
  AWS_ACCOUNT_ID_DEV: string
  AWS_NO_REPLY_EMAIL_DEV: string
  AWS_NO_REPLY_EMAIL_PROD: string
  FRONTEND_BASE_URL_DEV: string
  FRONTEND_BASE_URL_PROD: string
  DOMAIN_URL: string
  DEV_DOMAIN_URL: string
  API_URL: string
  DEV_API_URL: string
  SHARED_EVENT_BUS_NAME: string
  USER_POOL_ID: string
  DEV_USER_POOL_ID: string
  USER_GROUP_ROLE_ARN: string
}

const CONFIG: ConfigProps = {
  STACK_PREFIX: 'MembaUsers',
  REGION: 'eu-west-2',
  AWS_ACCOUNT_ID_PROD: '635800996936',
  AWS_ACCOUNT_ID_DEV: '544312030237',
  AWS_NO_REPLY_EMAIL_DEV: 'no-reply-dev@memba.co.uk',
  AWS_NO_REPLY_EMAIL_PROD: 'no-reply@memba.co.uk',
  FRONTEND_BASE_URL_DEV: 'https://dev.memba.co.uk',
  FRONTEND_BASE_URL_PROD: 'https://memba.co.uk',
  DOMAIN_URL: 'memba.co.uk',
  DEV_DOMAIN_URL: 'dev.memba.co.uk',
  API_URL: 'users.memba.co.uk',
  DEV_API_URL: 'users.dev.memba.co.uk',
  SHARED_EVENT_BUS_NAME: 'MembaEventBus',
  USER_POOL_ID: 'eu-west-2_5wmsSeZyn',
  DEV_USER_POOL_ID: 'eu-west-2_H6F7KWKl8',
  USER_GROUP_ROLE_ARN: 'MembaUsersUsersGroupRole',
}

export default CONFIG
