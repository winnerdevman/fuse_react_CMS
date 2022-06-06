import { NextFunction, Request, Response } from 'express'
import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import {
  OrganizationEntity,
  UserEntity,
  userModel,
} from '../../model/organization'
import { getRepository, MoreThan, Not } from 'typeorm'
import { ChatEntity, CHAT_STATUS, MessageEntity } from '../../model/chat'
import { OrganizationUserEntity } from '../../model/organization/organizationUser.entity'

export const getSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const organization: OrganizationEntity = req.body.organization

    // Get All Chat
    const allChat = await getRepository(ChatEntity).count({
      where: {
        organization,
      },
    })
    // Get Open Chat
    const openChat = await getRepository(ChatEntity).count({
      where: {
        organization,
        status: CHAT_STATUS.OPEN,
      },
    })

    // Get Today Message
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - 1)
    const todayMessage = await getRepository(MessageEntity).count({
      where: {
        organization,
        createdAt: MoreThan(date),
      },
    })
    // Get All Message
    const allMessage = await getRepository(MessageEntity).count({
      where: {
        organization,
      },
    })

    // Get All User
    const allUser = await getRepository(OrganizationUserEntity).count({
      where: {
        organization,
      },
    })
    return res.status(200).json({
      allChat,
      openChat,
      todayMessage,
      allMessage,
      allUser,
    })
  } catch (error) {
    errorMessage('CONTROLLER', 'channel', 'getChannels', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}
