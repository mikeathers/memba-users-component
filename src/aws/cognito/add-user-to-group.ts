import {cognito} from './index'

interface AddAdminToUserGroupProps {
  userPoolId: string
  username: string
  groups: string[]
}

export const addUserToGroup = (props: AddAdminToUserGroupProps) => {
  try {
    const {groups, userPoolId, username} = props

    groups.forEach((group) => {
      const params = {
        GroupName: group,
        UserPoolId: userPoolId,
        Username: username,
      }
      cognito.adminAddUserToGroup(params)
    })
  } catch (error) {
    console.log('ADD USER TO GROUP ERROR: ', error)
  }
}
