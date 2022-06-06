import { NextFunction, Request, Response } from 'express'
import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { OrganizationEntity, UserEntity } from '../../model/organization'
import { gcsService } from '../../service/google'

import {
  ChatEntity,
  chatModel,
  mentionModel,
  MessageEntity,
  messageModel,
  MESSAGE_TYPE,
  TC_MESSAGE_TYPE,
  TeamChatEntity,
} from '../../model/chat'
import { customerModel } from '../../model/customer'
import { lineService } from '../../service/channel'
import { notificationUtil } from '../../util'

export const getChats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { type, label } = req.query
    if (!type || typeof type !== 'string') {
      errorMessage('CONTROLLER', 'chat', 'invalid parameter(type)')
      return next(new HttpException(400, ErrorCode[400]))
    }
    const organization: OrganizationEntity = req.body.organization
    const requester: UserEntity = req.body.requester

    let chats: ChatEntity[]
    switch (type.toLowerCase()) {
      case 'resolve':
        chats = await chatModel.getChatsAllResolve(organization)
        break
      case 'active':
        chats = await chatModel.getChatsAllActive(organization)
        break
      case 'unassign':
        chats = await chatModel.getChatsAllUnassign(organization)
        break
      case 'assignee':
        chats = await chatModel.getChatsAllMyOwner(requester, organization)
        break
      case 'followup':
        chats = await chatModel.getChatsAllMyFollowup(requester, organization)
        break
      case 'spam':
        chats = await chatModel.getChatsAllSpam(requester, organization)
        break
      case 'mention':
        chats = await chatModel.getChatsAllMyMention(requester, organization)
        break
      case 'line':
        chats = await chatModel.getChatsAllActiveLineChannel(organization)
        break
      case 'facebook':
        chats = await chatModel.getChatsAllActiveFacebookChannel(organization)
        break
      default:
        chats = await chatModel.getChats(organization)
        break
    }

    if (!chats) {
      errorMessage('CONTROLLER', 'chat', 'get chats')
      return next(new HttpException(500, ErrorCode[500]))
    }

    // filter Label
    if(label && typeof label === 'string'){
      const inputLabel =  label.split(",")
      chats = await chats.filter((chat,index)=>{
        const labelsObj = chat.customer.customerLabel
        // no label
        if(!labelsObj || labelsObj.length <= 0){
          return false
        }
        // Get Label text from Object
        const labels = labelsObj.map((element) => element.label)

        // Return with SOME label
        return inputLabel.some(element => labels.includes(element));

        // Return with ALL label
        // return inputLabel.every(element => labels.includes(element));
        // return false
      })
    }

    // Convert Chats
    const convertChats = await chats.map((chat) => {
      chat.message.sort((a, b) => {
        return a.createdAt.getTime() - b.createdAt.getTime()
      })

      const lastMessage = chat.message[chat.message.length - 1]
      const unread = chat.message.filter((msg) => !msg.isRead).length

      const newMention =
        chat.mention.filter(
          (mention) => !mention.isRead && mention.user.id === requester.id,
        ).length > 0

      if (chat.customer && chat.customer.picture) {
        const picture = gcsService.getCustomerDisplayURL(
          organization.id,
          chat.channel.id,
          chat.customer.uid,
          chat.customer.picture,
        )

        return {
          ...chat,
          customer: {
            ...chat.customer,
            pictureURL: picture,
          },
          newMention,
          lastMessage,
          unread: unread > 0 ? unread : null,
        }
      } else {
        return {
          ...chat,
          lastMessage,
          newMention,
          unread: unread > 0 ? unread : null,
        }
      }
    })

    const lastMsgUnRead = convertChats.filter(
      (chat) => chat.lastMessage && !chat.lastMessage.isRead,
    )
    const lastMsgRead = convertChats.filter((chat) => chat.lastMessage && chat.lastMessage.isRead)

    lastMsgUnRead.sort((a, b) => {
      return (
        b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
      )
    })
    lastMsgRead.sort((a, b) => {
      return (
        b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
      )
    })    

    return res.status(200).send([...lastMsgUnRead, ...lastMsgRead])
  } catch (error) {
    errorMessage('CONTROLLER', 'chat', 'getChats', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const getChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const organization: OrganizationEntity = req.body.organization

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      errorMessage('CONTROLLER', 'chat', 'invalid parameter(id)')
      return next(new HttpException(400, ErrorCode[400]))
    }

    const result = await chatModel.getChatWithId(id, organization)
    if (!result) {
      errorMessage('CONTROLLER', 'chat', 'chat not found')
      return next(new HttpException(404, 'chat not found'))
    }

    messageModel.markReadMessageList(result.message)

    // Convert message
    const convertMessage = await result.message.map((message) => {
      if (message.type === MESSAGE_TYPE.TEXT) {
        return message
      }

      if (message.type === MESSAGE_TYPE.STICKER) {
        if (!JSON.parse(message.data).url) {
          const url = lineService.getStickerUrl(
            JSON.parse(message.data).sticker,
          )
          // message.data =  JSON.stringify({stickerURL})
          return { ...message, data: JSON.stringify({ url }) }
        } else {
          return { ...message }
        }
      }

      if (
        message.type === MESSAGE_TYPE.IMAGE ||
        message.type === MESSAGE_TYPE.AUDIO ||
        message.type === MESSAGE_TYPE.FILE ||
        message.type === MESSAGE_TYPE.VIDEO
      ) {
        if (!JSON.parse(message.data).url) {
          const url = gcsService.getChatMessageContentURL(
            organization.id,
            result.channel.id,
            result.customer.id,
            JSON.parse(message.data).filename,
          )
          // message.data =  JSON.stringify({url})
          return { ...message, data: JSON.stringify({ url }) }
        } else {
          return { ...message }
        }
      }
      if (
        message.type === MESSAGE_TYPE.BUTTONS ||
        message.type === MESSAGE_TYPE.CONFIRM ||
        message.type === MESSAGE_TYPE.CAROUSEL ||
        message.type === MESSAGE_TYPE.FLEX
      ) {
        return { ...message }

      }
    })

    if (convertMessage && convertMessage.length > 1) {
      convertMessage.sort((a, b) => {
        return a && b ? a.createdAt.getTime() - b.createdAt.getTime() : 0
      })
    }
    // Convert TeamChat message
    const convertTeamChatMessage = await result.teamChat.map((message) => {
      if (message.type === TC_MESSAGE_TYPE.TEXT) {
        return message
      }
      if (message.type === TC_MESSAGE_TYPE.IMAGE) {
        const url = gcsService.getTeamChatMessageContentURL(
          organization.id,
          result,
          JSON.parse(message.data).filename,
        )
        return { ...message, data: JSON.stringify({ url }) }
      }
    })
    
    if (convertTeamChatMessage && convertTeamChatMessage.length > 1) {
      convertTeamChatMessage.sort(function (obj1, obj2) {
        let a = obj1 as TeamChatEntity
        let b = obj2 as TeamChatEntity
        return a.createdAt.getTime() - b.createdAt.getTime()
      })
    }

    // Convert Customer Picture
    if (result.customer && result.customer.picture) {
      const picture = gcsService.getCustomerDisplayURL(
        organization.id,
        result.channel.id,
        result.customer.uid,
        result.customer.picture,
      )
      return res.status(200).send({
        ...result,
        message: convertMessage,
        teamChat: convertTeamChatMessage,
        customer: {
          ...result.customer,
          pictureURL: picture,
        },
      })
    }

    return res.status(200).send({
      ...result,
      message: convertMessage,
      teamChat: convertTeamChatMessage,
    })
  } catch (error) {
    errorMessage('CONTROLLER', 'chat', 'getChat', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const updateChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { chat } = req.body
  if (!chat || !chat.id) {
    errorMessage('CONTROLLER', 'chat', 'invalid data(chat)')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    // Save chat to database
    const newChat: ChatEntity = {
      ...chat,
      organization,
      updatedBy: requester,
    }
    return res.status(201).send(await chatModel.saveChat(newChat))
  } catch (error) {
    errorMessage('CONTROLLER', 'chat', 'updateChat', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const updateChatOwner = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { chat } = req.body
  if (!chat || !chat.id) {
    errorMessage('CONTROLLER', 'chat', 'invalid data(chat)')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    // Save chat to database
    const newChat: ChatEntity = {
      ...chat,
      organization,
      updatedBy: requester,
    }

    const saveChat = await chatModel.saveChat(newChat)

    // Send notification to owner
    if (saveChat.owner && requester && saveChat.owner.id !== requester.id) {
      notificationUtil.notificationNewChatOwner(saveChat)
    }

    return res.status(201).send(saveChat)
  } catch (error) {
    errorMessage('CONTROLLER', 'chat', 'updateChatOwner', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const deleteChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    errorMessage('CONTROLLER', 'reply', 'invalid parameter(id)')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    const result = await chatModel.getChatWithId(id, organization)
    if (!result) {
      errorMessage('CONTROLLER', 'chat', 'chat not found')
      return next(new HttpException(404, 'chat not found'))
    }
    // Save chat to database
    const newChat: ChatEntity = {
      ...result,
      isDelete: true,
      updatedBy: requester,
    }
    return res.status(201).send(await chatModel.saveChat(newChat))
  } catch (error) {
    errorMessage('CONTROLLER', 'chat', 'deleteChat', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const getChatHistories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const organization: OrganizationEntity = req.body.organization
    const result = await customerModel.getCustomers(organization)
    if (!result) {
      errorMessage('CONTROLLER', 'chat', 'get chat history')
      return next(new HttpException(500, ErrorCode[500]))
    }

    const convertHistories = result.map((customer) => {
      if (customer && customer.picture) {
        const pictureURL = gcsService.getCustomerDisplayURL(
          organization.id,
          customer.channel.id,
          customer.uid,
          customer.picture,
        )
        return {
          ...customer,
          pictureURL,
        }
      }

      return {
        ...customer,
      }
    })

    return res.status(200).send(convertHistories)
  } catch (error) {
    errorMessage('CONTROLLER', 'chat', 'getChatsHistory', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const getChatHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const organization: OrganizationEntity = req.body.organization
    const { id } = req.query
    if (!id || typeof id !== 'string') {
      errorMessage('CONTROLLER', 'customer', 'invalid parameter(id)')
      return next(new HttpException(400, ErrorCode[400]))
    }
    const result = await customerModel.getCustomerWithId(id, organization)
    if (!result) {
      errorMessage('CONTROLLER', 'customer', 'customer not found')
      return next(new HttpException(404, 'customer not found'))
    }

    // Convert chat
    const convertChat = await result.chat.map((chat) => {
      const convertMessages = chat.message
        .map((message) => {
          if (message.type === MESSAGE_TYPE.TEXT) {
            return message
          }
          if (message.type === MESSAGE_TYPE.STICKER) {
            if (!JSON.parse(message.data).url) {
              const url = lineService.getStickerUrl(
                JSON.parse(message.data).sticker,
              )
              // message.data =  JSON.stringify({stickerURL})
              return { ...message, data: JSON.stringify({ url }) }
            } else {
              return { ...message }
            }
          }

          if (
            message.type === MESSAGE_TYPE.IMAGE ||
            message.type === MESSAGE_TYPE.AUDIO ||
            message.type === MESSAGE_TYPE.FILE ||
            message.type === MESSAGE_TYPE.VIDEO
          ) {
            if (!JSON.parse(message.data).url) {
              const url = gcsService.getChatMessageContentURL(
                organization.id,
                result.channel.id,
                result.id,
                JSON.parse(message.data).filename,
              )
              // message.data =  JSON.stringify({url})
              return { ...message, data: JSON.stringify({ url }) }
            } else {
              return { ...message }
            }
          }
        })
        .sort((a, b) => {
          return a && b ? a.createdAt.getTime() - b.createdAt.getTime() : 0
        })
      return { ...chat, message: convertMessages }
    })


    if (result && result.picture) {
      const pictureURL = gcsService.getCustomerDisplayURL(
        organization.id,
        result.channel.id,
        result.uid,
        result.picture,
      )
      return res.status(200).send({
        ...result,
        pictureURL,
        chat: convertChat,
      })
    }

    return res.status(200).send({
      ...result,
      chat: convertChat,
    })

    // return res.status(200).send(result)
  } catch (error) {
    errorMessage('CONTROLLER', 'customer', 'getCustomer', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}
