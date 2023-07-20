import {CognitoIdentityServiceProvider} from 'aws-sdk'
import CONFIG from '../../config'

export * from './create-user'
export * from './create-tenant-user'
export * from './create-user-group'
export * from './add-user-to-group'
export * from './delete-user'

export const cognito = new CognitoIdentityServiceProvider({region: CONFIG.REGION})
