import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository } from 'typeorm'
import { OrganizationEntity, TeamEntity } from '../organization'
import { NotificationUserEntity } from '.'

export const getNotificationUsers = async (
  organization: OrganizationEntity,
) => {
  return await getRepository(NotificationUserEntity).find({
    where: {
      organization,
    },
    // select: ['notification', 'isRead'],
    relations: ['createdBy', 'updatedBy'],
  })
}

export const getNotificationUserWithUserId = async (
  userId: string,
  // organization: OrganizationEntity,
) => {
  return await getRepository(NotificationUserEntity).find({
    where: {
      user: {
        id: userId,
      },
      isRead:false,
      // organization,
    },
    relations: ['createdBy', 'updatedBy','notification','organization'],
  })
}

export const getNotificationUserWithId = async (
  id: string,
  // organization: OrganizationEntity,
) => {
  return await getRepository(NotificationUserEntity).findOne({
    where: {
      id,
      // organization,
    },
    // select: ['notification', 'isRead'],
    relations: ['createdBy', 'updatedBy'],
  })
}

export const saveNotificationUser = async (
  notificationUser: NotificationUserEntity,
) => {
  try {
    return await getRepository(NotificationUserEntity).save(notificationUser)
  } catch (error) {
    errorMessage('MODEL', 'notificationUser', 'saveNotificationUser', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
export const saveNotificationUsers = async (
  notificationUsers: NotificationUserEntity[],
) => {
  try {
    return await getRepository(NotificationUserEntity).save(notificationUsers)
  } catch (error) {
    errorMessage('MODEL', 'notificationUser', 'saveNotificationUser', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
