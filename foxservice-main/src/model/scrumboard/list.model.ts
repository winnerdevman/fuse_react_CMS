import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository } from 'typeorm'
import { OrganizationEntity } from '../organization'
import { ListEntity } from '.'
import { BoardEntity } from './board.entity'

export const getMaxOrderIndex = async (organization: OrganizationEntity, board: BoardEntity) => {
  const lists = await getlists(organization, board)
  if (lists.length > 0){
    return lists[lists.length-1].orderIndex;
  }else{
    return -1;
  }
}

export const getlists = async (organization: OrganizationEntity, board: BoardEntity) => {
  return await getRepository(ListEntity).find({
    where: {
      organization,
      board,
    },
    order: {
      orderIndex:"ASC"
    },
    relations: ['idCards'],
  })
}

export const getlistWithId = async (
  id: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(ListEntity).findOne({
    where: {
      id,
      organization,
      isDelete:false
      // card:{isDelete:false}
    },
    relations: ['idCards'],
  })
}

export const savelist = async (list: ListEntity) => {
  try {
    return await getRepository(ListEntity).save(list)
  } catch (error) {
    errorMessage('MODEL', 'list', 'savelist', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const deleteData = async (id:string, deleteFlg: boolean = false) => {
  try {
    if(deleteFlg) {
      return await getRepository(ListEntity).delete({id:id}) 
    }
    return await getRepository(ListEntity).save({id:id,isDelete:true})
  } catch (error) {
    errorMessage('MODEL', 'list delete', 'deleteList', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const updateListName =async (listId: string, listTitle: string, chatType: string, chatLabels: string) => {
  try {
    const result = await getRepository(ListEntity).update({id:listId}, {name: listTitle, chatType, chatLabels})
    return result
  } catch (error) {
    errorMessage('MODEL', 'list', 'updateListName', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const updateListLabels =async (listId: string, chatLabels: string) => {
  try {
    const result = await getRepository(ListEntity).update({id:listId}, {chatLabels})
    return result
  } catch (error) {
    errorMessage('MODEL', 'list', 'updateListLabels', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const updateListPageNumber =async (listId: string, pageNumber: number) => {
  try {
    const result = await getRepository(ListEntity).update({id:listId}, {pageNumber})
    return result
  } catch (error) {
    errorMessage('MODEL', 'list', 'updateListLabels', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const updateOrderIndex =async (listId: string, orderIndex: number) => {
  try {
    const result = await getRepository(ListEntity).update({id:listId}, {orderIndex: orderIndex})
    return result
  } catch (error) {
    errorMessage('MODEL', 'list', 'updateList orderIndex', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
