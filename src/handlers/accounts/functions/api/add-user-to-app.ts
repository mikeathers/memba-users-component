import axios, {AxiosError, AxiosResponse} from 'axios'
import {SecretsManager} from 'aws-sdk'
import {MembaUser} from '../../../../types'

interface AddUserToAppProps {
  tenantsApiUrl: string
  appId: string
  user: MembaUser
  tenantsApiSecretName: string
}

interface SecretResult {
  api_key: string
  username: string
}

const httpClient = axios.create()

export const addUserToApp = async (props: AddUserToAppProps) => {
  const {tenantsApiUrl, user, appId, tenantsApiSecretName} = props
  const params = {
    SecretId: tenantsApiSecretName,
  }

  const secretsManager = new SecretsManager()
  const apiKey = await secretsManager.getSecretValue(params).promise()

  try {
    const parsedApiKey = JSON.parse(apiKey.SecretString || '') as SecretResult

    const result: AxiosResponse = await httpClient.request({
      url: `${tenantsApiUrl}/add-user-to-app`,
      method: 'POST',
      headers: {
        ['x-api-key']: parsedApiKey.api_key,
      },
      data: {user, appId},
    })

    console.log('ADD USER TO APP RESULT:', result)

    return result.status === 200
  } catch (error) {
    console.log('ADD USER TO APP ERROR: ', error)
    if (!axios.isAxiosError(error)) {
      throw error
    } else {
      if ((error as AxiosError) && error.response?.status !== 500) {
        return false
      } else throw error
    }
  }
}
