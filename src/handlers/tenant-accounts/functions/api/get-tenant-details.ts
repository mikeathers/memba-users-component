import axios, {AxiosResponse} from 'axios'
import {SecretsManager} from 'aws-sdk'

interface GetTenantDetailsProps {
  tenantId: string
  tenantsApiUrl: string
  tenantsApiSecretName: string
}

interface SecretResult {
  api_key: string
  username: string
}

const httpClient = axios.create()

interface GetTenantResponse {
  message: string
  item: {
    admins: string[]
    apps: string[]
    id: string
  }
}
export const getTenantDetails = async (
  props: GetTenantDetailsProps,
): Promise<GetTenantResponse | null> => {
  const {tenantsApiUrl, tenantId, tenantsApiSecretName} = props
  const params = {
    SecretId: tenantsApiSecretName,
  }

  const secretsManager = new SecretsManager()
  const apiKey = await secretsManager.getSecretValue(params).promise()

  try {
    const parsedApiKey = JSON.parse(apiKey.SecretString || '') as SecretResult

    const response = await httpClient.request<unknown, AxiosResponse<GetTenantResponse>>({
      url: `${tenantsApiUrl}/get-tenant/${tenantId}`,
      method: 'GET',
      headers: {
        ['x-api-key']: parsedApiKey.api_key,
      },
    })

    console.log('GET TENANT RESULT:', response)

    return response.data
  } catch (error) {
    console.log('CREATE TENANT ERROR: ', error)
    throw error
  }
}
