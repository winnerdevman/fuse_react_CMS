import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository, In } from 'typeorm'
import { OrganizationEntity, TeamEntity } from '../organization'
import { NotificationSettingEntity } from '.'

export const getNotificationSettings = async (
  // organization: OrganizationEntity,
) => {
  return await getRepository(NotificationSettingEntity).find({
    // where: {
    //   organization,
    // },
    relations: ['createdBy', 'updatedBy'],
  })
}

export const getMentionNotificationSettingsWithEmailList = async (
  emailList: string[],
  // organization: OrganizationEntity,
) => {
  return await getRepository(NotificationSettingEntity).find({
    where: {
      // organization,
      user: {
        email: In(emailList),
      },
    },
    relations: ['user'],
  })
}

export const getNotificationSettingWithUserId = async (
  userId: string,
  // organization: OrganizationEntity,
) => {
  return await getRepository(NotificationSettingEntity).findOne({
    where: {
      user: {
        id: userId,
      },
      // organization,
    },
    relations: ['createdBy', 'updatedBy'],
  })
}

export const saveNotificationSetting = async (
  notificationUser: NotificationSettingEntity,
) => {
  try {
    return await getRepository(NotificationSettingEntity).save(notificationUser)
  } catch (error) {
    errorMessage(
      'MODEL',
      'notificationSetting',
      'saveNotificationSetting',
      error,
    )
    throw new HttpException(500, ErrorCode[500])
  }
}
