import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository } from 'typeorm'
import { OrganizationEntity } from '../organization'
import { CardActivityEntity } from '.'
import { CardEntity } from './card.entity'

export const getActivities = async (organization: OrganizationEntity) => {
  return await getRepository(CardActivityEntity).find({
    where: {
      organization,
    },
    relations: ['createdBy', 'updatedBy'],
  })
}

export const getActivityWithId = async (
  id: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(CardActivityEntity).findOne({
    where: {
      id,
      organization,
    },
    relations: ['createdBy', 'updatedBy', 'chat'],
  })
}

export const getActivitiesWithChatId = async (
  chatId: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(CardActivityEntity).find({
    where: {
      chat: {
        id: chatId,
      },
      organization,
    },
    relations: ['createdBy', 'updatedBy'],
  })
}

export const saveActivity = async (activity: CardActivityEntity) => {
  try {
    return await getRepository(CardActivityEntity).save(activity)
  } catch (error) {
    errorMessage('MODEL', 'activity', 'saveActivity', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const deleteData = async (card: CardEntity) => {
  try {
    return await getRepository(CardActivityEntity).delete({card:card})
  } catch (error) {
    errorMessage('MODEL', 'CardActivityEntity delete', 'deleteData', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
