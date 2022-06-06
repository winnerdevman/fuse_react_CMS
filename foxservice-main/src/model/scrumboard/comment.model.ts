import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository } from 'typeorm'
import { OrganizationEntity } from '../organization'
import { CommentEntity } from '.'

export const getComments = async (organization: OrganizationEntity) => {
  return await getRepository(CommentEntity).find({
    where: {
      organization,
    },
    relations: ['createdBy', 'updatedBy'],
  })
}

export const getCommentsWithChatId = async (
  chatId: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(CommentEntity).find({
    where: {
      chat: {
        id: chatId,
      },
      organization,
    },
    relations: ['createdBy', 'updatedBy', 'mention'],
  })
}

export const saveComment = async (comment: CommentEntity) => {
  try {
    return await getRepository(CommentEntity).save(comment)
  } catch (error) {
    errorMessage('MODEL', 'comment', 'saveComment', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
