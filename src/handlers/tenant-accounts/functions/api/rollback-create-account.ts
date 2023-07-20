import {deleteUser} from '../../../../aws/cognito'
import {DynamoDB} from 'aws-sdk'
import {deleteUserGroup} from '../../../../aws/cognito/delete-user-group'
import {deleteAccount} from './delete-account'

interface RollbackCreateAccountProps {
  username: string
  userId: string
  userPoolId: string
  groupName: string
  dbClient: DynamoDB.DocumentClient
  authenticatedUserId: string
}
export const rollbackCreateAccount = async (props: RollbackCreateAccountProps) => {
  const {username, userPoolId, authenticatedUserId, dbClient, groupName, userId} = props

  await deleteUser({
    username,
    userPoolId,
  })

  await deleteUserGroup({
    groupName,
    userPoolId,
  })

  await deleteAccount({
    dbClient,
    authenticatedUserId,
    id: userId,
  })
}
