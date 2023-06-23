import {cognito} from './index'

interface AddAdminToUserGroupProps {
  userPoolId: string
  username: string
  groups: string[]
}

export const addUserToGroup = (props: AddAdminToUserGroupProps) => {
  try {
    const {groups, userPoolId, username} = props

    const results = groups.map((group) => {
      const params = {
        GroupName: group,
        UserPoolId: userPoolId,
        Username: username,
      }

      return cognito.adminAddUserToGroup(params).promise()
    })
    return Promise.all(results)
  } catch (error) {
    console.log('ADD USER TO GROUP ERROR: ', error)
    return null
  }
}
