import {cognito} from './index'

interface DeleteUserGroupProps {
  groupName: string
  userPoolId: string
}

export const deleteUserGroup = async (props: DeleteUserGroupProps) => {
  const {groupName, userPoolId} = props

  const params = {
    GroupName: groupName,
    UserPoolId: userPoolId,
  }

  return cognito.deleteGroup(params).promise()
}
