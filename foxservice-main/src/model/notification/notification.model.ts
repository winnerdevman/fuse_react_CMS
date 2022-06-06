import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository } from 'typeorm'
import { OrganizationEntity, TeamEntity } from '../organization'
import { NotificationEntity } from '.'

export const getNotifications = async (organization: OrganizationEntity) => {
  return await getRepository(NotificationEntity).find({
    where: {
      organization,
    },
    relations: ['createdBy', 'updatedBy'],
  })
}

export const saveNotification = async (notification: NotificationEntity) => {
  try {
    return await getRepository(NotificationEntity).save(notification)
  } catch (error) {
    errorMessage('MODEL', 'notification', 'saveNotification', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
