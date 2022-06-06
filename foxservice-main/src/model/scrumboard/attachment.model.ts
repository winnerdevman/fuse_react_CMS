import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository } from 'typeorm'
import { OrganizationEntity } from '../organization'
import { CardActivityEntity } from '.'
import { CardEntity } from './card.entity'
import { CardAttachmentEntity } from './attachment.entity'

export const getAttachments = async (organization: OrganizationEntity) => {
  return await getRepository(CardAttachmentEntity).find({
    where: {
      organization,
    },
  })
}

export const getAttachmentWithId = async (
  id: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(CardAttachmentEntity).findOne({
    where: {
      id,
      organization,
    },
  })
}

export const getAttachmentWithCard = async (
  card: CardEntity,
  organization: OrganizationEntity,
) => {
  return await getRepository(CardAttachmentEntity).find({
    where: {
      card,
      organization,
    },
  })
}

export const saveAttachment = async (attachment: CardAttachmentEntity) => {
  try {
    return await getRepository(CardAttachmentEntity).save(attachment)
  } catch (error) {
    errorMessage('MODEL', 'attachment', 'saveAttachment', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const deleteData = async (id: string) => {
  try {
    return await getRepository(CardAttachmentEntity).delete({id})
  } catch (error) {
    errorMessage('MODEL', 'CardAttachmentEntity delete', 'deleteData', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const deleteDataWithCard = async (card: CardEntity) => {
  try {
    return await getRepository(CardAttachmentEntity).delete({card:card})
  } catch (error) {
    errorMessage('MODEL', 'CardAttachmentEntity delete', 'deleteData', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
