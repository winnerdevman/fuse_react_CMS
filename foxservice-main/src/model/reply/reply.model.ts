import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository, In } from 'typeorm'
import { OrganizationEntity, TeamEntity } from '../organization'
import {
  ReplyEntity,
  ReplyKeywordEntity,
  REPLY_EVENT,
  REPLY_STATUS,
  REPLY_TYPE,
} from '.'
import { getKeyword } from '../../controller/reply/keyword'

export const getReplies = async (organization: OrganizationEntity) => {
  return await getRepository(ReplyEntity).find({
    where: {
      organization,
      isDelete: false,
    },
    relations: ['createdBy', 'updatedBy'],
  })
}
export const getRepliesWithType = async (
  type: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(ReplyEntity).find({
    where: {
      type,
      status: REPLY_STATUS.ACTIVE,
      isDelete: false,
      organization,
    },
    relations: ['createdBy', 'updatedBy', 'response'],
  })
}

export const getReplyWithId = async (
  replyId: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(ReplyEntity).findOne({
    where: {
      id: replyId,
      isDelete: false,
      organization,
    },
    relations: ['createdBy', 'updatedBy', 'keyword', 'response', 'organization'],
  })
}

export const getAutoReplyWithId = async (
  replyId: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(ReplyEntity).findOne({
    where: {
      id: replyId,
      isDelete: false,
      organization,
      type: REPLY_TYPE.AUTO,
      status: REPLY_STATUS.ACTIVE,
    },
    relations: ['response'],
  })
}
export const getWelcomeReply = async (organization: OrganizationEntity) => {
  return await getRepository(ReplyEntity).findOne({
    where: {
      isDelete: false,
      organization,
      type: REPLY_TYPE.AUTO,
      status: REPLY_STATUS.ACTIVE,
      event: REPLY_EVENT.WELCOME,
    },
    order: { createdAt: 'DESC' },
    relations: ['response'],
  })
}

export const saveReply = async (reply: ReplyEntity) => {
  try {
    return await getRepository(ReplyEntity).save(reply)
  } catch (error) {
    errorMessage('MODEL', 'reply', 'saveReply', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
