import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository, Not } from 'typeorm'
import { OrganizationEntity } from '../organization'
import { CardEntity } from '.'
import { ListEntity } from './list.entity'
import { BoardEntity } from './board.entity'

export const getCards = async (organization: OrganizationEntity) => {
  return await getRepository(CardEntity).find({
    where: {
      organization,
    },
    order: {
      orderIndex:"ASC"
    },
    relations: ['createdBy', 'updatedBy'],
  })
}

export const getCardWithId = async (
  id: string, organization: OrganizationEntity
) => {
  return await getRepository(CardEntity).findOne({
    relations:['list', 'activities', 'attachments', 'checklists', 'checklists.checkItems'],
    where: {
      id,
      organization,
      isDelete: false,
    },
    order: {
      createdAt:"DESC"
    },
  })
}

export const getCardWithDelete = async (
  id: string, organization: OrganizationEntity
) => {
  return await getRepository(CardEntity).findOne({
    relations:['activities', 'attachments', 'checklists', 'checklists.checkItems'],
    where: {
      id,
      organization,
    },
    order: {
      createdAt:"DESC"
    },
  })
}

export const getCardWithChatId = async (
  chatId: string, 
  list: ListEntity, 
  organization: OrganizationEntity
) => {
  return await getRepository(CardEntity).findOne({
    where: {
      chatId,
      list,
      organization,
      // isDelete: false,
    },
    order: {
      createdAt:"DESC"
    },    
    relations:['list', 'activities', 'attachments', 'checklists', 'checklists.checkItems'],
  })
}

export const getCardWithIdUnRelation = async (
  id: string, organization: OrganizationEntity
) => {
  return await getRepository(CardEntity).findOne({
    where: {
      id,
      organization,
    },
  })
}

export const getMaxOrderIndex = async (list: ListEntity, organization: OrganizationEntity) => {
  const cards = await getCardsWithListId(list, organization) as CardEntity[]  
  if (cards.length > 0){
    return cards[cards.length-1].orderIndex
  }
  return -1
}

export const getCardWithBoard = async (
  board: BoardEntity, organization: OrganizationEntity
) => {
  return await getRepository(CardEntity).find({
    relations:['activities', 'attachments', 'checklists', 'checklists.checkItems','createdBy','list'],
    where: {
      board,
      organization,
      isDelete: false,
    },
    order: {
      createdAt:"DESC"
    },
  })
}

export const getCardsWithListId = async (list: ListEntity, organization: OrganizationEntity) => {
  return await getRepository(CardEntity).find({
    where: {
      list,
      organization: organization,
      isDelete:false,
    },
    order: {
      orderIndex:"ASC",
      createdAt:"DESC",
    },
    relations:['list', 'activities', 'attachments', 'checklists', 'checklists.checkItems'],
  })
}

export const getChatCardsWithList = async (list: ListEntity, organization: OrganizationEntity) => {
  return await getRepository(CardEntity).find({
    where: {
      list,
      chatId: Not(''),
      organization: organization,
    },
    order: {
      orderIndex:"ASC",
      createdAt:"DESC",
    },
    relations: ['list'],
  })
}

export const getCardsWithUserId = async (
  userId: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(CardEntity).find({
    where: {
      user: {
        id: userId,
      },
      organization,
    },
    order: {
      orderIndex:"ASC",
      createdAt:"DESC",
    },
    relations: ['createdBy', 'updatedBy'],
  })
}

export const saveCard = async (card: CardEntity) => {
  
  try {
    return await getRepository(CardEntity).save(card)
  } catch (error) {
    errorMessage('MODEL', 'card', 'saveCard', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const deleteCard = async (id: string, deleteFlg:boolean) => {
  try {
    if (deleteFlg) {
      return await getRepository(CardEntity).delete({id:id})  
    }
    return await getRepository(CardEntity).save({id:id,isDelete:true})
  } catch (error) {
    errorMessage('MODEL', 'card delete', 'deleteCard', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const saveCards = async (cards: CardEntity[]) => {
  try {
    return await getRepository(CardEntity).save(cards)
  } catch (error) {
    errorMessage('MODEL', 'card', 'saveCard', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const updateOrderIndex =async (cardId: string, orderIndex: number, list:ListEntity) => {
  try {
    const result = await getRepository(CardEntity).update({id:cardId}, {orderIndex: orderIndex, list})
    return result
  } catch (error) {
    errorMessage('MODEL', 'card', 'updateOrderIndex', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
