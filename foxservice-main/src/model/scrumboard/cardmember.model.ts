import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository } from 'typeorm'
import { CardMemberEntity } from './cardmember.entity'

export const getCardMembers = async (cardId: string) => {
  return await getRepository(CardMemberEntity).find({
    where: {
      cardId,
    },
  })
}

export const saveCardMember = async (cardMember: CardMemberEntity) => {
  
  try {
    return await getRepository(CardMemberEntity).save(cardMember)
  } catch (error) {
    errorMessage('MODEL', 'cardmember', 'saveCardMember', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const saveCardMembers = async (members: CardMemberEntity[]) => {
  try {
    return await getRepository(CardMemberEntity).save(members)
  } catch (error) {
    errorMessage('MODEL', 'cardmember', 'saveCardMembers', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const deleteCardMembers = async (cardId: string) => {
  try {
    return await getRepository(CardMemberEntity).delete({cardId:cardId})
  } catch (error) {
    errorMessage('MODEL', 'cardmember', 'saveCardMembers', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const deleteCardMember = async (id: string) => {
  try {
    return await getRepository(CardMemberEntity).delete({id:id})
  } catch (error) {
    errorMessage('MODEL', 'cardmember', 'saveCardMembers', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
