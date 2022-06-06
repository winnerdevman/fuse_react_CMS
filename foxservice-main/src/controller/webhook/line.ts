import { NextFunction, Request, Response } from 'express'
import * as crypto from 'crypto'
import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { channelModel } from '../../model/channel'
import { OrganizationEntity, UserEntity } from '../../model/organization'
import {
  chatModel,
  MessageEntity,
  messageModel,
  MESSAGE_TYPE,
} from '../../model/chat'
import { ChannelEntity } from '../../model/channel/channel.entity'
import { lineService } from '../../service/channel'
import { gcsService } from '../../service/google'
import { MESSAGE_DIRECTION } from '../../model/chat/message.entity'
import { ChatEntity } from '../../model/chat/chat.entity'
import { CustomerEntity } from '../../model/customer/customer.entity'
import { customerModel } from '../../model/customer'
import * as channelService from '../../service/channel'
import * as replyService from '../../service/reply'
import { notificationUtil, workingHoursUtil } from '../../util'
import { sseController } from '../sse'
import { sendMessage } from '../chat/message'

export const validateRequestHeader = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const headerSignature = req.headers['x-line-signature']
  if (!headerSignature || typeof headerSignature !== 'string') {
    errorMessage('CONTROLLER', 'line', 'invalid header signature')
    return next(new HttpException(400, ErrorCode[400]))
  }

  // Get Channel
  const { channelCode } = req.params
  if (!channelCode) {
    errorMessage('CONTROLLER', 'line', 'invalid parameter(channelCode)')
    return next(new HttpException(400, ErrorCode[400]))
  }
  const channelId = Buffer.from(channelCode, 'base64').toString('binary')
  const channel = await channelModel.getChannelWithIdAndOnOrganization(
    channelId,
  )
  if (!channel) {
    errorMessage('CONTROLLER', 'webhook.line', 'channel not found')
    return next(new HttpException(404, ErrorCode[404]))
  }

  const channelSecret = channel.line.channelSecret
  const body = JSON.stringify(req.body)
  const signature = await crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64')
  const compare = signature.localeCompare(headerSignature)

  if (compare !== 0) {
    errorMessage('CONTROLLER', 'webhook.line', 'signature is wrong')
    return next(new HttpException(400, ErrorCode[400]))
  }

  // set channel for next function
  req.body.channel = channel
  req.body.organization = channel.organization

  next()
  // res.sendStatus(200)
}

interface ILineSource {
  type: string
  userId: string
  groupId?: string
  roomId?: string
}
interface ILineMessage {
  id: string
  type: string
  text?: string
  [key: string]: any
}
interface ILineMessageEvent {
  // Common properties
  type: string
  mode: string
  timestamp: number
  source: ILineSource
  // Specific message event properties
  replyToken: string
  message: ILineMessage
}

// Convert Line event object to FoxConnect MessageEntity object
const convertMessageEvent = async (
  organizationId: string,
  event: ILineMessageEvent,
  customer: CustomerEntity,
  channel: ChannelEntity,
  chat: ChatEntity,
) => {
  if (event.type !== 'message') {
    errorMessage('CONTROLLER', 'webhook.line', 'input event wrong type')
    throw new HttpException(400, ErrorCode[400])
  }

  // Note : PostgreSQL doesn't support storing NULL (\0x00) characters in text fields
  const nullCharRegExp = new RegExp(/\u0000|\x00/m)

  const timestamp = new Date(Number(event.timestamp))
  const messageTimestamp = timestamp ? timestamp : new Date()
  let lineMessageData = {}
  switch (event.message.type) {
    case MESSAGE_TYPE.TEXT:
      if (!event.message.text) {
        errorMessage('CONTROLLER', 'webhook.line', 'text type wrong format')
        throw new HttpException(400, ErrorCode[400])
      }
      lineMessageData = {
        text: event.message.text.replace(nullCharRegExp, ''),
      }
      break
    case MESSAGE_TYPE.STICKER:
      if (!event.message.stickerId) {
        errorMessage('CONTROLLER', 'webhook.line', 'sticker type wrong format')
        throw new HttpException(400, ErrorCode[400])
      }
      lineMessageData = { sticker: event.message.stickerId }
      break
    case MESSAGE_TYPE.LOCATION:
      if (!event.message.stickerId) {
        errorMessage('CONTROLLER', 'webhook.line', 'sticker type wrong format')
        throw new HttpException(400, ErrorCode[400])
      }

      lineMessageData = {
        title: event.message.title,
        address: event.message.address,
        latitude: event.message.latitude,
        longitude: event.message.longitude,
      }
      break
    case MESSAGE_TYPE.AUDIO:
    case MESSAGE_TYPE.IMAGE:
    case MESSAGE_TYPE.FILE:
    case MESSAGE_TYPE.VIDEO:
      const mediaObj = await lineService.getMediaContent(
        channel,
        event.message.id,
      )
      const filename = await gcsService.uploadChatMessageFromFileObject(
        organizationId,
        channel,
        customer.id,
        event.message.id,
        mediaObj,
      )
      lineMessageData = { filename }
      break
    default:
      errorMessage(
        'CONTROLLER',
        'webhook.line',
        'unsupported message event type',
      )
      throw new HttpException(400, ErrorCode[400])
  }

  return {
    ...new MessageEntity(),
    data: JSON.stringify(lineMessageData),
    channel,
    type: event.message.type,
    timestamp: messageTimestamp,
    direction: MESSAGE_DIRECTION.INBOUND,
    chat,
    organization: chat.organization,
  } as MessageEntity
}

export const receiveMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // destination: User ID of a bot that should receive webhook events.
    const { channel, destination, events } = req.body

    if (!destination || !events) {
      errorMessage(
        'CONTROLLER',
        'webhook.line',
        'invalid data(destination/events)',
      )
      return next(new HttpException(400, ErrorCode[400]))
    }
    if (!channel) {
      errorMessage('CONTROLLER', 'webhook.line', 'invalid data(channel)')
      return next(new HttpException(400, ErrorCode[400]))
    }

    // for verify webhook
    if (events && events.length === 0) {
      return res.sendStatus(200)
    }

    const organization: OrganizationEntity = req.body.organization

    /**
     * Section: Message event type
     * Description: Filter message type only
     */
    const messageEvent = await events.filter(
      (element: { type: string }) => element && element.type === 'message',
    )
    messageEvent.forEach(async (event: ILineMessageEvent) => {
      /**
       * Check Customer
       */
      let customer: CustomerEntity
      try {
        if (event.source && event.source.type !== 'user') {
          errorMessage('CONTROLLER', 'webhook.line', 'unsupported source type')
          return
          throw new HttpException(400, ErrorCode[400])
        }
        const foxCustomer = await customerModel.getCustomerWithUidAndChannel(
          event.source.userId,
          channel,
          organization,
        )
        if (!foxCustomer) {
          // No customer on FoxConnect -> Get Profile and create new customer
          const newProfile: channelService.ISocialProfile =
            await channelService.getCustomerProfile(
              event.source.userId,
              channel,
            )
          if (!newProfile) {
            errorMessage('CONTROLLER', 'webhook.line', 'get customer profile')
            throw new HttpException(400, ErrorCode[400])
          }

          // Upload Profile picture to FoxConnect
          const filename = await gcsService.uploadChatCustomerDisplay(
            channel,
            newProfile.uid,
            newProfile.uid,
            newProfile.picture,
          )
          customer = await customerModel.saveCustomer({
            ...new CustomerEntity(),
            channel,
            uid: newProfile.uid,
            picture: filename,
            display: newProfile.display,
            organization,
          })
        } else {
          customer = foxCustomer
        }
      } catch (error) {
        errorMessage(
          'CONTROLLER',
          'webhook.line',
          'receiveMessage(customer)',
          error,
        )
        // return next(new HttpException(400, ErrorCode[400]))
        return
      }

      /**
       * Check Chat
       */
      let chat: ChatEntity
      let isNewChat = false
      try {
        const foxChat = await chatModel.getActiveChatWithCustomerId(
          customer.id,
          organization,
        )
        // Create New Chat
        if (!foxChat) {
          chat = await chatModel.saveChat({
            ...new ChatEntity(),
            customer,
            channel,
            organization,
          })
          isNewChat = true
        } else {
          chat = foxChat
        }
      } catch (error) {
        errorMessage(
          'CONTROLLER',
          'webhook.line',
          'receiveMessage(chat)',
          error,
        )
        return
        // throw new HttpException(400, ErrorCode[400])
      }

      /**
       * New Message
       */
      let message
      try {
        const newMessage = await convertMessageEvent(
          organization.id,
          event,
          customer,
          channel,
          chat,
        )
        message = await messageModel.saveMessage(newMessage)
      } catch (error) {
        errorMessage(
          'CONTROLLER',
          'webhook.line',
          'receiveMessage(message)',
          error,
        )
        return
        // throw new HttpException(400, ErrorCode[400])
      }

      if (isNewChat) {
        // Check auto response welcome type
        try {
          replyService.sendWelcomeMessage(chat, channel, customer, organization)
        } catch (error) {
          errorMessage(
            'CONTROLLER',
            'webhook.line',
            'auto response(welcome message)',
            error,
          )
        }
        // Send Notification new Chat to all chat user
        notificationUtil.notificationNewChat(chat)
        // sseController.sendEventToAllSubscriber(organization.id, JSON.parse(JSON.stringify({ event: 'newChat' })))
      } else {
        // Check auto response response type only text message
        if (message.type === MESSAGE_TYPE.TEXT) {
          try {
            const messageData = JSON.parse(message.data)
            replyService.sendAutoResponseMessage(
              messageData.text,
              chat,
              channel,
              customer,
              organization,
            )
          } catch (error) {
            errorMessage('CONTROLLER', 'webhook.line', 'auto response', error)
          }
        }
        // sseController.sendEventToAllSubscriber(organization.id, JSON.parse(JSON.stringify({ event: 'newMessage' })))
        // notificationUtil.notificationNewEvent(organization)
        // sseController.sendEventToAllSubscriber(
        //   organization.id,
        //   JSON.parse(JSON.stringify({ event: 'newEvent' })),
        // )
        // Send Notification new Message to owner
        if (chat.owner) {
          notificationUtil.notificationNewMessage(message)
        }
      }

      // Check Working Hours
      try {
        const result = await workingHoursUtil.isWorkingHours(organization)
        if (!result) {
          // Send Working Hour Message
          workingHoursUtil.sendWorkingHourMessage(
            chat,
            channel,
            customer,
            organization,
          )
        }
      } catch (error) {
        errorMessage('CONTROLLER', 'webhook.line', 'Working Hours', error)
      }

      sseController.sendEventToAllSubscriber(
        organization.id,
        JSON.parse(JSON.stringify({ event: 'newEvent' })),
      )
    })
    res.status(200).send({
      code: 'received',
    })

    // You must send back a 200, within 20 seconds, to let us know you've
  } catch (error) {
    errorMessage('CONTROLLER', 'webhook.line', 'receiveMessage', error)
    return next(new HttpException(400, ErrorCode[400]))
  }
}
