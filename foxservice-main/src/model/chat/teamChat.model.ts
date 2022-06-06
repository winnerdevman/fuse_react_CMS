import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository } from 'typeorm'
import { OrganizationEntity } from '../organization'
import { TeamChatEntity } from '.'

export const getTeamChats = async (organization: OrganizationEntity) => {
  return await getRepository(TeamChatEntity).find({
    where: {
      organization,
    },
    relations: ['createdBy', 'updatedBy'],
  })
}

export const getTeamChatsWithChatId = async (
  chatId: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(TeamChatEntity).find({
    where: {
      chat: {
        id: chatId,
      },
      organization,
    },
    relations: ['createdBy', 'updatedBy', 'mention'],
  })
}

export const saveTeamChat = async (teamChat: TeamChatEntity) => {
  try {
    return await getRepository(TeamChatEntity).save(teamChat)
  } catch (error) {
    errorMessage('MODEL', 'teamChat', 'saveTeamChat', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
