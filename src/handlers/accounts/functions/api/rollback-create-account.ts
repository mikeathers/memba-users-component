import {deleteUser} from '../../../../aws/cognito'
import {DynamoDB} from 'aws-sdk'
import {deleteUserGroup} from '../../../../aws/cognito/delete-user-group'
import {deleteAccount} from './delete-account'
import {deleteItem} from '../../../../aws'

interface RollbackCreateAccountProps {
  username: string
  userId: string
  userPoolId: string
  groupName: string
  dbClient: DynamoDB.DocumentClient
  tableName: string
}
export const rollbackCreateAccount = async (props: RollbackCreateAccountProps) => {
  const {username, userPoolId, dbClient, groupName, userId, tableName} = props

  await deleteUser({
    username,
    userPoolId,
  })

  await deleteItem({
    dbClient,
    id: userId,
    tableName,
  })

  await deleteUserGroup({
    groupName,
    userPoolId,
  })
}
