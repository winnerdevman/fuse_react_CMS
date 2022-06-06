import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository } from 'typeorm'
import { OrganizationEntity } from '../organization'
import { ChecklistEntity } from '.'

export const getChecklists = async (organization: OrganizationEntity) => {
  return await getRepository(ChecklistEntity).find({
    where: {
      organization,
    },
    relations: ['createdBy', 'updatedBy'],
  })
}

export const getChecklistsWithChatId = async (
  chatId: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(ChecklistEntity).find({
    where: {
      chat: {
        id: chatId,
      },
      organization,
    },
    relations: ['createdBy', 'updatedBy', 'mention'],
  })
}

export const getChecklistWithChatId =async (
  checklistId: string,
  cardId: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(ChecklistEntity).findOne({
    where:{
      id: checklistId,
      card: {
        id: cardId,
      },
      organization,
    },
    relations:['checkItems'],
  })
}

export const getChecklistWithId =async (
  checklistId: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(ChecklistEntity).findOne({
    where:{
      id: checklistId,
      organization,
    },
  })
}

export const saveChecklist = async (checklist: ChecklistEntity) => {
  try {
    return await getRepository(ChecklistEntity).save(checklist)
  } catch (error) {
    errorMessage('MODEL', 'checklist', 'saveChecklist', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const deleteChecklist = async (id: string) => {
  try {
    return await getRepository(ChecklistEntity).delete({id:id})
  } catch (error) {
    errorMessage('MODEL', 'cardchecklist delete', 'deleteChecklist', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
