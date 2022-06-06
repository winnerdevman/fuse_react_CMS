import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository, In, Not } from 'typeorm'
import { OrganizationEntity, UserEntity } from '../organization'
import { ChatEntity, CHAT_STATUS, MentionEntity } from '.'
import { CHANNEL } from '../channel'

export const getChats = async (organization: OrganizationEntity) => {
  return await getRepository(ChatEntity).find({
    where: {
      isDelete: false,
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'customer',
      'message',
      'channel',
      'mention',
      'mention.user',
      'customer.customerLabel',
      'channel.line',
      'channel.facebook',
    ],
  })
}
export const getChatsAllActive = async (organization: OrganizationEntity) => {
  return await getRepository(ChatEntity).find({
    where: {
      status: Not(CHAT_STATUS.NONE),
      isDelete: false,
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'customer',
      'message',
      'channel',
      'mention',
      'mention.user',
      'customer.customerLabel',
      'channel.line',
      'channel.facebook',
    ],
  })
}
export const getChatsAllResolve = async (organization: OrganizationEntity) => {
  return await getRepository(ChatEntity).find({
    where: {
      status: CHAT_STATUS.NONE,
      isDelete: false,
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'customer',
      'message',
      'channel',
      'mention',
      'mention.user',
      'customer.customerLabel',
      'channel.line',
      'channel.facebook',
    ],
  })
}
export const getChatsAllUnassign = async (organization: OrganizationEntity) => {
  return await getRepository(ChatEntity).find({
    where: {
      status: Not(CHAT_STATUS.NONE),
      owner: undefined,
      isDelete: false,
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'customer',
      'message',
      'channel',
      'mention',
      'mention.user',
      'customer.customerLabel',
      'channel.line',
      'channel.facebook',
    ],
  })
}
export const getChatsAllMyOwner = async (
  requester: UserEntity,
  organization: OrganizationEntity,
) => {
  return await getRepository(ChatEntity).find({
    where: {
      status: Not(CHAT_STATUS.NONE),
      owner: requester,
      isDelete: false,
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'customer',
      'message',
      'channel',
      'mention',
      'mention.user',
      'customer.customerLabel',
      'channel.line',
      'channel.facebook',
    ],
  })
}
export const getChatsAllMyMention = async (
  requester: UserEntity,
  organization: OrganizationEntity,
) => {
  const mentions = await getRepository(MentionEntity).find({
    where: {
      user: requester,
      organization,
    },
    relations: ['chat'],
  })
  // const chatIds = await mentions.map((element) => element.chatId)

  return await getRepository(ChatEntity).find({
    where: {
      status: Not(CHAT_STATUS.NONE),
      id: In(mentions.map((element) => element.chat.id)),
      isDelete: false,
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'customer',
      'message',
      'channel',
      'mention',
      'mention.user',
      'customer.customerLabel',
      'channel.line',
      'channel.facebook',
    ],
  })
}
export const getChatsAllMyFollowup = async (
  requester: UserEntity,
  organization: OrganizationEntity,
) => {
  return await getRepository(ChatEntity).find({
    where: {
      status: Not(CHAT_STATUS.NONE),
      owner: requester,
      followup: true,
      isDelete: false,
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'customer',
      'message',
      'channel',
      'mention',
      'mention.user',
      'customer.customerLabel',
      'channel.line',
      'channel.facebook',
    ],
  })
}
export const getChatsAllSpam = async (
  requester: UserEntity,
  organization: OrganizationEntity,
) => {
  return await getRepository(ChatEntity).find({
    where: {
      owner: requester,
      spam: true,
      isDelete: false,
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'customer',
      'message',
      'channel',
      'mention',
      'mention.user',
      'customer.customerLabel',
      'channel.line',
      'channel.facebook',
    ],
  })
}
export const getChatsAllActiveLineChannel = async (
  organization: OrganizationEntity,
) => {
  return await getRepository(ChatEntity).find({
    where: {
      status: Not(CHAT_STATUS.NONE),
      channel: {
        channel: CHANNEL.LINE,
      },
      isDelete: false,
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'customer',
      'message',
      'channel',
      'mention',
      'mention.user',
      'customer.customerLabel',
      'channel.line',
      'channel.facebook',
    ],
  })
}
export const getChatsAllActiveFacebookChannel = async (
  organization: OrganizationEntity,
) => {
  return await getRepository(ChatEntity).find({
    where: {
      status: Not(CHAT_STATUS.NONE),
      channel: {
        channel: CHANNEL.FACEBOOK,
      },
      isDelete: false,
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'customer',
      'message',
      'channel',
      'mention',
      'mention.user',
      'customer.customerLabel',
      'channel.line',
      'channel.facebook',
    ],
  })
}

export const getChatsWithCustomerId = async (
  customerId: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(ChatEntity).find({
    where: {
      customer: {
        id: customerId,
      },
      isDelete: false,
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'message',
      'channel',
      'mention',
      'mention.user',
      'customer.customerLabel',
      'channel.line',
      'channel.facebook',
    ],
  })
}
export const getActiveChatWithCustomerId = async (
  customerId: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(ChatEntity).findOne({
    where: {
      customer: {
        id: customerId,
      },
      status: Not(CHAT_STATUS.NONE),
      isDelete: false,
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'message',
      'organization',
      'channel',
      'owner',
      'customer',
      'mention',
      'mention.user',
      'customer.customerLabel',
      'channel.line',
      'channel.facebook',
    ],
    order: { createdAt: 'DESC' },
  })
}

export const getChatWithId = async (
  id: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(ChatEntity).findOne({
    where: {
      id,
      isDelete: false,
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'message',
      'activity',
      'channel',
      'channel.line',
      'channel.facebook',
      'customer',
      'teamChat',
      'teamChat.createdBy',
      'mention',
      'mention.user',
      'owner',
      'customer.customerLabel',
    ],
  })
}


export const getChatsWithId = async (
  id: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(ChatEntity).find({
    where: {
      id,
      isDelete: false,
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'message',
      'activity',
      'channel',
      'channel.line',
      'channel.facebook',
      'customer',
      'teamChat',
      'teamChat.createdBy',
      'mention',
      'mention.user',
      'owner',
      'customer.customerLabel',
    ],
  })
}

export const saveChat = async (chat: ChatEntity) => {
  try {
    return await getRepository(ChatEntity).save(chat)
  } catch (error) {
    errorMessage('MODEL', 'chat', 'saveChat', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const updateStatus = async (chatId: string, status: CHAT_STATUS) => {
  try {
    return await getRepository(ChatEntity).update({id:chatId}, {status: status})
  } catch (error) {
    errorMessage('MODEL', 'chat', 'updateStatus', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
