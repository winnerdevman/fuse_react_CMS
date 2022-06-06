import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository } from 'typeorm'
import { OrganizationEntity } from '../organization'
import { MessageEntity } from '.'

export const getMessages = async (organization: OrganizationEntity) => {
  return await getRepository(MessageEntity).find({
    where: {
      organization,
    },
    relations: ['createdBy', 'updatedBy'],
  })
}

export const saveMessage = async (message: MessageEntity) => {
  try {
    return await getRepository(MessageEntity).save(message)
  } catch (error) {
    errorMessage('MODEL', 'message', 'saveMessage', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const markReadMessageList = async (messages: MessageEntity[]) => {
  try {
    const isReadList = await messages.map((item) => ({ ...item, isRead: true }))
    return await getRepository(MessageEntity).save(isReadList)
  } catch (error) {
    errorMessage('MODEL', 'message', 'markReadMessageList', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
