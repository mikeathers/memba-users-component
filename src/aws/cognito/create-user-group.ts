import {cognito} from './index'

interface createUserGroupProps {
  groupName: string
  userPoolId: string
  userGroupRoleArn: string
}

export const createUserGroup = async (props: createUserGroupProps) => {
  try {
    const {groupName, userPoolId, userGroupRoleArn} = props

    const params = {
      GroupName: groupName,
      UserPoolId: userPoolId,
      Description: `A group for ${groupName} users`,
      Precedence: 4,
      RoleArn: userGroupRoleArn,
    }

    console.log('Create Group Params: ', params)

    return cognito.createGroup(params).promise()
  } catch (err) {
    console.error('CREATE USER GROUP ERROR', err)
    return null
  }
}
