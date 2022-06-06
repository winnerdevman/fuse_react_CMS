import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository } from 'typeorm'
import { OrganizationEntity } from '../organization'
import { ChecklistEntity, ChecklistItemEntity } from '.'

export const getChecklistItems = async (organization: OrganizationEntity) => {
  return await getRepository(ChecklistItemEntity).find({
    where: {
      organization,
    },
    relations: ['createdBy', 'updatedBy'],
  })
}
export const getChecklistItemWithId = async (id: string, organization: OrganizationEntity) => {
  return await getRepository(ChecklistItemEntity).findOne({
    where: {
      id,
      organization,
    },
  })
}

export const saveChecklistItem = async (checklistItem: ChecklistItemEntity) => {
  try {
    return await getRepository(ChecklistItemEntity).save(checklistItem)
  } catch (error) {
    errorMessage('MODEL', 'checklistItem', 'saveChecklistItem', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const deleteChecklistItem = async (id: string) => {
  try {
    return await getRepository(ChecklistItemEntity).delete({id:id})
  } catch (error) {
    errorMessage('MODEL', 'checklistItem delete', 'deleteChecklistItem', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const deleteChecklistItemWithChecklist = async (checklist: ChecklistEntity) => {
  try {
    return await getRepository(ChecklistItemEntity).delete({checklist:checklist})
  } catch (error) {
    errorMessage('MODEL', 'checklistItem delete', 'deleteChecklistItem', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const markReadChecklistItemList = async (checklistItems: ChecklistItemEntity[]) => {
  try {
    const isReadList = await checklistItems.map((item) => ({ ...item, isRead: true }))
    return await getRepository(ChecklistItemEntity).save(isReadList)
  } catch (error) {
    errorMessage('MODEL', 'checklistItem', 'markReadChecklistItemList', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
