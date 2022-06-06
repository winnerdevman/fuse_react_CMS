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
import {
  chatModel,
  mentionModel,
  TeamChatEntity,
  teamChatModel,
} from '../../model/chat'
import { customerModel } from '../../model/customer'
import { channelModel } from '../../model/channel'
import { gcsService } from '../../service/google'
import { notificationUtil } from '../../util'
import { TC_MESSAGE_TYPE } from '../../model/chat/teamChat.entity'
import { sseController } from '../sse'
// import { sseController } from '../sse'
import { MentionEntity } from '../../model/chat/mention.entity'
import { saveMentions } from '../../model/chat/mention.model'

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { chatId, message } = req.body
  if (!chatId || typeof chatId !== 'string') {
    errorMessage('CONTROLLER', 'teamChat', 'invalid parameter(chatId)')
    return next(new HttpException(400, ErrorCode[400]))
  }
  if (!message || !message.data || !message.type || message.id) {
    errorMessage('CONTROLLER', 'teamChat', 'invalid data(message)')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    const chat = await chatModel.getChatWithId(chatId, organization)
    if (!chat) {
      errorMessage('CONTROLLER', 'teamChat', 'chat not found')
      return next(new HttpException(404, 'chat not found'))
    }

    // Add new message to database
    const newMessage: TeamChatEntity = {
      ...message,
      chat,
      createdBy: requester,
      organization,
    }

    const teamChatMessageResult = await teamChatModel.saveTeamChat(newMessage)

    // notificationUtil.notificationNewEvent(organization)
    sseController.sendEventToAllSubscriber(
      organization.id,
      JSON.parse(JSON.stringify({ event: 'newEvent' })),
    )

    // get mention user in message
    if (message.type === TC_MESSAGE_TYPE.TEXT) {
      const textMessage = JSON.parse(message.data).text
      const mentionEmailList = textMessage.match(
        /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
      )
      // Send Notification Event
      if (
        mentionEmailList &&
        mentionEmailList.length &&
        mentionEmailList.length > 0
      ) {
        notificationUtil.notificationTeamChatMention(
          mentionEmailList,
          teamChatMessageResult,
        )
        // Save mention to database
        const users = await userModel.getUserWithEmailList(mentionEmailList)
        if (users && users.length > 0) {
          const mentions = await users.map((user) => {
            return {
              ...new MentionEntity(),
              user,
              chat,
              teamChat: teamChatMessageResult,
              createdBy: requester,
              organization,
            } as MentionEntity
          })
          mentionModel.saveMentions(mentions)
        }
      }
    }

    return res.status(200).send(teamChatMessageResult)
  } catch (error) {
    errorMessage('CONTROLLER', 'teamChat.message', 'sendMessage')
    return next(new HttpException(400, ErrorCode[400]))
  }
}

export const uploadContent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { chatId } = req.params
  if (!chatId) {
    errorMessage('CONTROLLER', 'message', 'invalid parameter(chatId)')
    return next(new HttpException(400, ErrorCode[400]))
  }
  const organization: OrganizationEntity = req.body.organization

  const content = req.file
  if (!content) {
    errorMessage('CONTROLLER', 'message', 'invalid file')
    return next(new HttpException(400, ErrorCode[400]))
  }

  try {
    const chat = await chatModel.getChatWithId(chatId, organization)
    if (!chat) {
      errorMessage('CONTROLLER', 'teamChat', 'chat not found')
      return next(new HttpException(404, 'chat not found'))
    }

    const filename = Buffer.from(
      `${chat.id}${new Date().getTime()}`,
      'binary',
    ).toString('base64')

    const contentName = await gcsService.uploadTeamChatMessageFromFileObject(
      organization.id,
      chat,
      filename,
      { data: content.buffer },
    )

    const url = await gcsService.getTeamChatMessageContentURL(
      organization.id,
      chat,
      filename,
    )
    return res.status(200).json({
      message: 'Upload was successful',
      fileName: contentName,
      url,
    })
  } catch (error) {
    errorMessage('CONTROLLER', 'teamChat.message', 'uploadContent', error)
    return next(new HttpException(400, ErrorCode[400]))
  }
}

export const markReaMentions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    const mentionResult = await mentionModel.getMentionsWithUserId(
      requester.id,
      organization,
    )

    const newMention: MentionEntity[] = await mentionResult.map((item) => {
      item.isRead = true
      item.updatedBy = requester
      return item
    })
    return res.status(201).send(await mentionModel.saveMentions(newMention))
  } catch (error) {
    errorMessage('CONTROLLER', 'mention', 'markReaMentions', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}
