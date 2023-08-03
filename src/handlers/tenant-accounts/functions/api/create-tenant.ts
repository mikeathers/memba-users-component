import axios, {AxiosResponse} from 'axios'
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

const httpClient = axios.create()

interface CreateTenantResponse {
  admins: string[]
  apps: string[]
  id: string
}
export const createTenant = async (
  props: CheckIfTenantAdminExistsProps,
): Promise<CreateTenantResponse | null> => {
  const {tenantsApiUrl, tenantAdminId, tenantsApiSecretName} = props
  const params = {
    SecretId: tenantsApiSecretName,
  }

  const secretsManager = new SecretsManager()
  const apiKey = await secretsManager.getSecretValue(params).promise()

  try {
    const parsedApiKey = JSON.parse(apiKey.SecretString || '') as SecretResult

    const response = await httpClient.request<
      unknown,
      AxiosResponse<CreateTenantResponse>
    >({
      url: `${tenantsApiUrl}/create-tenant`,
      data: {
        admins: [tenantAdminId],
      },
      method: 'POST',
      headers: {
        ['x-api-key']: parsedApiKey.api_key,
      },
    })

    console.log('CREATE TENANT RESULT:', response)

    return response.data
  } catch (error) {
    console.log('CREATE TENANT ERROR: ', error)
    throw error
  }
}
