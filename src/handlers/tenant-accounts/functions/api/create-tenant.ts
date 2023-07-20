import axios, {AxiosError, AxiosResponse} from 'axios'
import {SecretsManager} from 'aws-sdk'

interface CheckIfTenantAdminExistsProps {
  tenantsApiUrl: string
  tenantsApiSecretName: string
  tenantAdminId: string
}

interface SecretResult {
  api_key: string
  username: string
}

interface CreateTenantResult {
  id: string
  admins: string[]
  apps: string[]
}

const httpClient = axios.create()

export const createTenant = async (props: CheckIfTenantAdminExistsProps) => {
  const {tenantsApiUrl, tenantAdminId, tenantsApiSecretName} = props
  const params = {
    SecretId: tenantsApiSecretName,
  }

  const secretsManager = new SecretsManager()
  const apiKey = await secretsManager.getSecretValue(params).promise()

  try {
    const parsedApiKey = JSON.parse(apiKey.SecretString || '') as SecretResult

    const result = await httpClient.request<CreateTenantResult>({
      url: `${tenantsApiUrl}/create-tenant`,
      data: {
        admins: [tenantAdminId],
      },
      method: 'POST',
      headers: {
        ['x-api-key']: parsedApiKey.api_key,
      },
    })

    console.log('CREATE TENANT RESULT:', result)

    return result
  } catch (error) {
    console.log('CREATE TENANT ERROR: ', error)
    throw error
  }
}
