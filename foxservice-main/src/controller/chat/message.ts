import { NextFunction, Request, Response } from 'express'
import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { OrganizationEntity, UserEntity } from '../../model/organization'
import {
  chatModel,
  MessageEntity,
  messageModel,
  MESSAGE_DIRECTION,
  MESSAGE_TYPE,
} from '../../model/chat'
import * as channelService from '../../service/channel'
import { channelModel } from '../../model/channel'
import { gcsService } from '../../service/google'
import { customerModel } from '../../model/customer'
import { replyModel, RESPONSE_TYPE } from '../../model/reply'

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { chatId, message } = req.body
  if (!chatId || typeof chatId !== 'string') {
    errorMessage('CONTROLLER', 'message', 'invalid parameter(chatId)')
    return next(new HttpException(400, ErrorCode[400]))
  }
  if (!message || !message.data || !message.type || message.id) {
    errorMessage('CONTROLLER', 'message', 'invalid data(message)')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    const chat = await chatModel.getChatWithId(chatId, organization)
    if (!chat) {
      errorMessage('CONTROLLER', 'message', 'chat not found')
      return next(new HttpException(404, 'chat not found'))
    }

    // Add new message to database
    const newMessage: MessageEntity = {
      ...message,
      direction: MESSAGE_DIRECTION.OUTBOUND,
      chat,
      channel: chat.channel,
      isRead: true,
      timestamp: new Date(),
      organization,
      createdBy: requester,
    }

    switch (message.type) {
      case 'text':
        newMessage.type = MESSAGE_TYPE.TEXT
        //   newMessage.data = JSON.parse(JSON.stringify({ text: message }))
        break
      case 'image':
      case 'video':
      case 'file':
        newMessage.type = MESSAGE_TYPE.IMAGE
        //   newMessage.data = JSON.parse(JSON.stringify({ filename: message }))
        break
      default:
        errorMessage('CONTROLLER', 'message', 'invalid message type')
        return next(new HttpException(400, ErrorCode[400]))
    }

    const messageResult = await messageModel.saveMessage(newMessage)

    // Send message to customer
    const channel = await channelModel.getChannelWithId(
      chat.channel.id,
      organization,
    )
    if (!channel) {
      errorMessage('CONTROLLER', 'message', 'channel not found')
      return next(new HttpException(404, ErrorCode[404]))
    }
    const sendMessageResult = await channelService.sendMessage(
      organization.id,
      channel,
      chat.customer,
      messageResult,
    )
    if (!sendMessageResult) {
      errorMessage('CONTROLLER', 'message', 'channel send message')
      return next(new HttpException(404, ErrorCode[404]))
    }

    return res.status(200).send(messageResult)
  } catch (error) {
    errorMessage('CONTROLLER', 'message', 'sendMessage')
    return next(new HttpException(400, ErrorCode[400]))
  }
}

export const sendReplyMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { chatId, replyId } = req.body
  if (
    !chatId ||
    typeof chatId !== 'string' ||
    !replyId ||
    typeof replyId !== 'string'
  ) {
    errorMessage('CONTROLLER', 'message', 'invalid parameter(chatId/replyId)')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    const chat = await chatModel.getChatWithId(chatId, organization)
    if (!chat) {
      errorMessage('CONTROLLER', 'message', 'chat not found')
      return next(new HttpException(404, 'chat not found'))
    }
    const reply = await replyModel.getReplyWithId(replyId, organization)
    if (!reply) {
      errorMessage('CONTROLLER', 'message', 'reply not found')
      return next(new HttpException(404, 'reply not found'))
    }

    for await (const response of reply.response) {
      // Add new message to database
      const newMessage: MessageEntity = {
        ...new MessageEntity(),
        direction: MESSAGE_DIRECTION.OUTBOUND,
        chat,
        channel: chat.channel,
        isRead: true,
        timestamp: new Date(),
        organization,
        createdBy: requester,
      }

      switch (response.type) {
        case RESPONSE_TYPE.TEXT:
          // Replace TEXT Keyword
          let templateMessage: string = JSON.parse(response.data).text
          templateMessage = templateMessage.replace(
            '{{displayName}}',
            `${chat.customer.display}`,
          )
          templateMessage = templateMessage.replace(
            '{{accountName}}',
            `${requester.firstname} ${requester.lastname}`,
          )
          newMessage.type = MESSAGE_TYPE.TEXT
          newMessage.data = JSON.stringify({ text: templateMessage })

          // await sendMessage(
          //   channel,
          //   channelId,
          //   userId,
          //   MESSAGE_TYPE.TEXT,
          //   templateMessage,
          // )
          break
        case RESPONSE_TYPE.IMAGE:
          newMessage.type = MESSAGE_TYPE.IMAGE
          newMessage.data = JSON.stringify({
            filename: JSON.parse(response.data).image.filename,
          })
          await gcsService.copyReplyResponseContentToMessage(
            organization.id,
            chat.channel.id,
            chat.customer.id,
            reply.id,
            JSON.parse(response.data).image.filename,
          )
          break

        case RESPONSE_TYPE.BUTTONS:
          newMessage.type = MESSAGE_TYPE.BUTTONS
          newMessage.data = response.data
          break
        case RESPONSE_TYPE.CONFIRM:
          newMessage.type = MESSAGE_TYPE.CONFIRM
          newMessage.data = response.data
          break
        case RESPONSE_TYPE.CAROUSEL:
          newMessage.type = MESSAGE_TYPE.CAROUSEL
          newMessage.data = response.data
          break
        case RESPONSE_TYPE.FLEX:
          newMessage.type = MESSAGE_TYPE.FLEX
          newMessage.data = response.data
          break

        default:
          errorMessage('CONTROLLER', 'message', 'templates not support')
          return next(new HttpException(400, ErrorCode[400]))
      }

      const messageResult = await messageModel.saveMessage(newMessage)

      const sendMessageResult = await channelService.sendMessage(
        organization.id,
        chat.channel,
        chat.customer,
        messageResult,
      )
      if (!sendMessageResult) {
        errorMessage('CONTROLLER', 'message', 'channel send message')
        return next(new HttpException(404, ErrorCode[404]))
      }

      // Send Notification Event
      //
      //
      //
    }
    return res.status(200).send({ success: true })
  } catch (error) {
    errorMessage('CONTROLLER', 'message', 'sendMessage')
    return next(new HttpException(400, ErrorCode[400]))
  }
}

export const uploadContent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { channelId, uid } = req.params
  if (!channelId || !uid) {
    errorMessage('CONTROLLER', 'message', 'invalid parameter(channel/uid)')
    return next(new HttpException(400, ErrorCode[400]))
  }
  const organization: OrganizationEntity = req.body.organization
  const channel = await channelModel.getChannelWithId(channelId, organization)
  if (!channel) {
    errorMessage('CONTROLLER', 'message', 'channel not found')
    return next(new HttpException(404, ErrorCode[404]))
  }

  const customer = await customerModel.getCustomerWithUidAndChannel(
    uid,
    channel,
    organization,
  )
  if (!customer) {
    errorMessage('CONTROLLER', 'message', 'customer not found')
    return next(new HttpException(404, ErrorCode[404]))
  }

  const content = req.file
  if (!content) {
    errorMessage('CONTROLLER', 'message', 'invalid file')
    return next(new HttpException(400, ErrorCode[400]))
  }

  try {
    const contentName = await gcsService.uploadChatMessageFromFileObject(
      organization.id,
      channel,
      customer.id,
      content.originalname,
      { data: content.buffer },
    )

    const url = await gcsService.getChatMessageContentURL(
      organization.id,
      channel.id,
      customer.id,
      contentName,
    )
    return res.status(200).json({
      message: 'Upload was successful',
      fileName: contentName,
      url,
    })
  } catch (error) {
    errorMessage('CONTROLLER', 'message', 'uploadContent', error)
    return next(new HttpException(400, ErrorCode[400]))
  }
}
