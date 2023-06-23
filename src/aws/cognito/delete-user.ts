import {cognito} from './index'

interface DeleteUserProps {
  username: string
  userPoolId: string
}

export const deleteUser = async (props: DeleteUserProps) => {
  const {username, userPoolId} = props

  const params = {
    Username: username,
    UserPoolId: userPoolId,
  }

  return cognito.adminDeleteUser(params).promise()
}
