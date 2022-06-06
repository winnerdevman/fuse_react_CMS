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

export const webhookValidate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (
      channelService.facebookService.validate(
        String(req.query['hub.mode']),
        String(req.query['hub.verify_token']),
      )
    ) {
      res.status(200).send(req.query['hub.challenge'])
    } else {
      errorMessage(
        'CONTROLLER',
        'facebook',
        'Failed validation. Make sure the validation tokens match.',
      )
      return next(new HttpException(403, 'Failed validation.'))
    }
  } catch (error) {
    errorMessage('CONTROLLER', 'facebook', 'webhookValidate', error)
    return next(new HttpException(403, 'Failed validation.'))
  }
}

interface IFacebookMessaging {
  sender: any
  recipient: any
  [key: string]: any
}
interface IFacebookMessageEntry {
  // Common properties
  id: string
  time: string
  messaging: IFacebookMessaging[]
  [key: string]: any
}

// Convert Line event object to FoxConnect MessageEntity object
const convertMessageEvent = async (
  organizationId: string,
  facebookMessage: IFacebookMessaging,
  customer: CustomerEntity,
  channel: ChannelEntity,
  chat: ChatEntity,
) => {
  if (!facebookMessage.message) {
    errorMessage('CONTROLLER', 'webhook.facebook', 'input event wrong type')
    throw new HttpException(400, ErrorCode[400])
  }

  // Note : PostgreSQL doesn't support storing NULL (\0x00) characters in text fields
  const nullCharRegExp = new RegExp(/\u0000|\x00/m)

  const timestamp = new Date(Number(facebookMessage.timestamp))
  const messageTimestamp = timestamp ? timestamp : new Date()

  let facebookMessageData = {}
  let facebookMessageType
  if (facebookMessage.message.text) {
    // Text Message
    facebookMessageType = MESSAGE_TYPE.TEXT
    facebookMessageData = {
      text: facebookMessage.message.text.replace(nullCharRegExp, ''),
    }
  } else if (facebookMessage.message.attachments) {
    // Message with attachment <image|video|audio|file>
    const attachments: { url: any }[] = []
    await facebookMessage.message.attachments.forEach(
      (attachment: {
        type: string
        payload: { url: string; sticker_id?: string }
      }) => {
        if (
          !attachment.type ||
          (attachment.type !== 'image' &&
            attachment.type !== 'audio' &&
            attachment.type !== 'video' &&
            attachment.type !== 'file' &&
            attachment.type !== 'location')
        ) {
          errorMessage(
            'CONTROLLER',
            'webhook.facebook',
            'unsupported attachment message type',
          )
          return
        }
        if (attachment.type === MESSAGE_TYPE.IMAGE) {
          // sticker will be image type
          if (attachment.payload.sticker_id) {
            facebookMessageType = MESSAGE_TYPE.STICKER
          } else {
            facebookMessageType = MESSAGE_TYPE.IMAGE
          }
        } else {
          // video/location/audio/file
          facebookMessageType = attachment.type
        }

        attachments.push({ url: attachment.payload.url })
      },
    )

    if (attachments && attachments.length > 1) {
      facebookMessageData = {
        ...attachments.shift(),
        more: attachments,
      }
    } else {
      facebookMessageData = {
        url: attachments[0].url,
      }
    }
  }

  return {
    ...new MessageEntity(),
    data: JSON.stringify(facebookMessageData),
    channel,
    type: facebookMessageType,
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
    const { object, entry } = req.body

    if (!object || !entry) {
      errorMessage(
        'CONTROLLER',
        'webhook.facebook',
        'invalid data(object/entry)',
      )
      return next(new HttpException(400, ErrorCode[400]))
    }

    /**
     * Section: "object":"page"
     */

    if (object !== 'page') {
      errorMessage('CONTROLLER', 'webhook.facebook', 'unsupported object type')
      return next(new HttpException(400, ErrorCode[400]))
    }

    await entry.forEach(async (element: IFacebookMessageEntry) => {
      if (element.messaging && element.messaging.length) {
        await element.messaging.forEach(
          async (facebookMessage: IFacebookMessaging) => {
            const PSID = facebookMessage.sender.id
            const PAGE_ID = facebookMessage.recipient.id

            if (!PSID || !PAGE_ID) {
              errorMessage(
                'CONTROLLER',
                'webhook.facebook',
                'invalid data(sender/recipient) skip this message',
              )
              return
            }

            const channel =
              await channelModel.getFacebookChannelWithPageIdAndOnOrganization(
                PAGE_ID,
              )
            if (!channel || !channel.organization) {
              errorMessage(
                'CONTROLLER',
                'webhook.facebook',
                'invalid data(channel/organization) skip this message',
              )
              return
            }
            const organization: OrganizationEntity = channel.organization

            /**
             * Check Customer
             */
            let customer: CustomerEntity
            try {
              const foxCustomer =
                await customerModel.getCustomerWithUidAndChannel(
                  PSID,
                  channel,
                  organization,
                )
              if (!foxCustomer) {
                // No customer on FoxConnect -> Get Profile and create new customer
                const newProfile: channelService.ISocialProfile =
                  await channelService.getCustomerProfile(PSID, channel)
                if (!newProfile) {
                  errorMessage(
                    'CONTROLLER',
                    'webhook.facebook',
                    'get customer profile',
                  )
                  return next(new HttpException(400, ErrorCode[400]))
                }

                let filename
                if (newProfile.picture && newProfile.picture !== '') {
                  // Upload Profile picture to FoxConnect
                  filename = await gcsService.uploadChatCustomerDisplay(
                    channel,
                    newProfile.uid,
                    newProfile.uid,
                    newProfile.picture,
                  )
                }

                customer = await customerModel.saveCustomer({
                  ...new CustomerEntity(),
                  firstname: newProfile.firstname ? newProfile.firstname : '',
                  lastname: newProfile.lastname ? newProfile.lastname : '',
                  channel,
                  uid: newProfile.uid,
                  picture: filename ? filename : '',
                  display: newProfile.display,
                  organization,
                })
              } else {
                customer = foxCustomer
              }
            } catch (error) {
              errorMessage(
                'CONTROLLER',
                'webhook.facebook',
                'receiveMessage(customer)',
                error,
              )
              return // next(new HttpException(400, ErrorCode[400]))
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
                'webhook.facebook',
                'receiveMessage(chat)',
                error,
              )
              return
              // return next(new HttpException(400, ErrorCode[400]))
            }

            /**
             * New Message
             */
            let message
            try {
              const newMessage = await convertMessageEvent(
                organization.id,
                facebookMessage,
                customer,
                channel,
                chat,
              )
              message = await messageModel.saveMessage(newMessage)
            } catch (error) {
              errorMessage(
                'CONTROLLER',
                'webhook.facebook',
                'receiveMessage(message)',
                error,
              )
              return
              // return next(new HttpException(400, ErrorCode[400]))
            }

            if (isNewChat) {
              // Check auto response welcome type
              try {
                replyService.sendWelcomeMessage(
                  chat,
                  channel,
                  customer,
                  organization,
                )
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
                  errorMessage(
                    'CONTROLLER',
                    'webhook.line',
                    'auto response',
                    error,
                  )
                }
              }

              // notificationUtil.notificationNewEvent(organization)
              // sseController.sendEventToAllSubscriber(
              //   organization.id,
              //   JSON.parse(JSON.stringify({ event: 'newEvent' })),
              // )
              // sseController.sendEventToAllSubscriber(
              //   organization.id,
              //   JSON.parse(JSON.stringify({ event: 'newMessage' }))
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
              errorMessage(
                'CONTROLLER',
                'webhook.facebook',
                'Working Hours',
                error,
              )
            }

            sseController.sendEventToAllSubscriber(
              organization.id,
              JSON.parse(JSON.stringify({ event: 'newEvent' })),
            )
          },
        )
      }
    })

    res.status(200).send({
      code: 'received',
    })
    // You must send back a 200, within 20 seconds, to let us know you've
  } catch (error) {
    errorMessage('CONTROLLER', 'webhook.facebook', 'receiveMessage', error)
    return next(new HttpException(400, ErrorCode[400]))
  }
}
