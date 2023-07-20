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
  DEV_TENANTS_API_URL: string
  TENANTS_API_URL: string
  DEV_TENANTS_API_SECRET_NAME: string
  TENANTS_API_SECRET_NAME: string
}

const CONFIG: ConfigProps = {
  STACK_PREFIX: 'Users',
  REGION: 'eu-west-2',
  AWS_ACCOUNT_ID_PROD: '635800996936',
  AWS_ACCOUNT_ID_DEV: '544312030237',
  AWS_NO_REPLY_EMAIL_DEV: 'no-reply-dev@memba.co.uk',
  AWS_NO_REPLY_EMAIL_PROD: 'no-reply@memba.co.uk',
  FRONTEND_BASE_URL_DEV: 'https://id.dev.memba.co.uk',
  FRONTEND_BASE_URL_PROD: 'https://id.memba.co.uk',
  DOMAIN_URL: 'memba.co.uk',
  DEV_DOMAIN_URL: 'dev.memba.co.uk',
  API_URL: 'users.memba.co.uk',
  DEV_API_URL: 'users.dev.memba.co.uk',
  SHARED_EVENT_BUS_NAME: 'SharedEventBus',
  DEV_TENANTS_API_URL: 'https://tenants.dev.memba.co.uk',
  TENANTS_API_URL: 'https://tenants.memba.co.uk',
  DEV_TENANTS_API_SECRET_NAME: 'TenantsApiSecret17D4018F-nKLmRF8VYKDR',
  TENANTS_API_SECRET_NAME: 'TenantsApiSecret17D4018F-h7NuQvhBk9mS',
}

export default CONFIG
