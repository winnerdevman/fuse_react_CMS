import { CustomerEntity } from '../model/customer'

import * as channelService from './channel'
import {
  keywordModel,
  replyModel,
  REPLY_EVENT,
  RESPONSE_TYPE,
} from '../model/reply'
import { OrganizationEntity } from '../model/organization'
import { errorMessage } from '../middleware/exceptions'
import { ChannelEntity } from '../model/channel'
import { gcsService } from '../service/google'
import {
  ChatEntity,
  MessageEntity,
  messageModel,
  MESSAGE_DIRECTION,
  MESSAGE_TYPE,
} from '../model/chat'

export const sendWelcomeMessage = async (
  chat: ChatEntity,
  channel: ChannelEntity,
  customer: CustomerEntity,
  organization: OrganizationEntity,
) => {
  const reply = await replyModel.getWelcomeReply(organization)
  if (!reply || !reply.response || reply.event !== REPLY_EVENT.WELCOME) {
    console.info('[SendReply][WelcomeMessage] reply not found')
    return null
  }
  const response = reply.response
  response.forEach(async (element) => {
    // New Message
    try {
      const newMessage = {
        ...new MessageEntity(),
        data: element.data,
        channel,
        type: element.type as unknown as MESSAGE_TYPE,
        timestamp: new Date(),
        direction: MESSAGE_DIRECTION.OUTBOUND,
        chat,
        organization,
      } as MessageEntity

      switch (element.type) {
        case RESPONSE_TYPE.TEXT:
          // Replace TEXT Keyword
          let templateMessage: string = JSON.parse(element.data).text
          templateMessage = templateMessage.replace(
            '{{displayName}}',
            `${customer.display}`,
          )
          templateMessage = templateMessage.replace('{{accountName}}', `Admin`)
          newMessage.type = MESSAGE_TYPE.TEXT
          newMessage.data = JSON.stringify({ text: templateMessage })
          break
        case RESPONSE_TYPE.IMAGE:
          newMessage.type = MESSAGE_TYPE.IMAGE
          newMessage.data = JSON.stringify({
            filename: JSON.parse(element.data).image.filename,
          })
          await gcsService.copyReplyResponseContentToMessage(
            organization.id,
            chat.channel.id,
            chat.customer.id,
            reply.id,
            JSON.parse(element.data).image.filename,
          )
          break

        case RESPONSE_TYPE.BUTTONS:
          newMessage.type = MESSAGE_TYPE.BUTTONS
          newMessage.data = element.data
          break
        case RESPONSE_TYPE.CONFIRM:
          newMessage.type = MESSAGE_TYPE.CONFIRM
          newMessage.data = element.data
          break
        case RESPONSE_TYPE.CAROUSEL:
          newMessage.type = MESSAGE_TYPE.CAROUSEL
          newMessage.data = element.data
          break
        case RESPONSE_TYPE.FLEX:
          newMessage.type = MESSAGE_TYPE.FLEX
          newMessage.data = element.data
          break

        default:
          errorMessage('CONTROLLER', 'message', 'templates not support')
          return
      }
      const message = await messageModel.saveMessage(newMessage)

      channelService.sendMessage(organization.id, channel, customer, message)
    } catch (error) {
      errorMessage('SERVICE', 'reply.sendWelcomeMessage', 'sendMessage', error)
      return
      // throw new HttpException(400, ErrorCode[400])
    }
  })
}

export const sendAutoResponseMessage = async (
  keyword: string,
  chat: ChatEntity,
  channel: ChannelEntity,
  customer: CustomerEntity,
  organization: OrganizationEntity,
) => {
  console.info('[SendReply][AutoResponseMessage] keyword ', keyword)
  const replyKeyword = await keywordModel.getKeywordWithKeyword(
    keyword.toLowerCase(),
    organization,
  )

  if (!replyKeyword || !replyKeyword.reply) {
    console.info('[SendReply][ResponseMessage] replyKeyword not found')
    return null
  }
  console.log('[replyKeyword] ', replyKeyword.id)

  const reply = await replyModel.getAutoReplyWithId(
    replyKeyword.reply.id,
    organization,
  )
  if (!reply || !reply.response || reply.event !== REPLY_EVENT.RESPONSE) {
    console.info('[SendReply][ResponseMessage] reply not found')
    return null
  }

  console.log('[reply] ', reply.id)

  const response = reply.response
  response.forEach(async (element) => {
    try {
      const newMessage = {
        ...new MessageEntity(),
        data: element.data,
        channel,
        type: element.type as unknown as MESSAGE_TYPE,
        timestamp: new Date(),
        direction: MESSAGE_DIRECTION.OUTBOUND,
        chat,
        organization,
      } as MessageEntity

      switch (element.type) {
        case RESPONSE_TYPE.TEXT:
          // Replace TEXT Keyword
          let templateMessage: string = JSON.parse(element.data).text
          templateMessage = templateMessage.replace(
            '{{displayName}}',
            `${customer.display}`,
          )
          templateMessage = templateMessage.replace('{{accountName}}', `Admin`)
          newMessage.type = MESSAGE_TYPE.TEXT
          newMessage.data = JSON.stringify({ text: templateMessage })
          break
        case RESPONSE_TYPE.IMAGE:
          newMessage.type = MESSAGE_TYPE.IMAGE
          newMessage.data = JSON.stringify({
            filename: JSON.parse(element.data).image.filename,
          })
          await gcsService.copyReplyResponseContentToMessage(
            organization.id,
            chat.channel.id,
            chat.customer.id,
            reply.id,
            JSON.parse(element.data).image.filename,
          )
          break

        case RESPONSE_TYPE.BUTTONS:
          newMessage.type = MESSAGE_TYPE.BUTTONS
          newMessage.data = element.data
          break
        case RESPONSE_TYPE.CONFIRM:
          newMessage.type = MESSAGE_TYPE.CONFIRM
          newMessage.data = element.data
          break
        case RESPONSE_TYPE.CAROUSEL:
          newMessage.type = MESSAGE_TYPE.CAROUSEL
          newMessage.data = element.data
          break
        case RESPONSE_TYPE.FLEX:
          newMessage.type = MESSAGE_TYPE.FLEX
          newMessage.data = element.data
          break

        default:
          errorMessage('CONTROLLER', 'message', 'templates not support')
          return
      }
      const message = await messageModel.saveMessage(newMessage)

      channelService.sendMessage(organization.id, channel, customer, message)
    } catch (error) {
      errorMessage(
        'SERVICE',
        'reply.sendAutoResponseMessage',
        'sendMessage',
        error,
      )
      return
      // throw new HttpException(400, ErrorCode[400])
    }
  })
}
