import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository } from 'typeorm'
import { BoardLabelEntity } from '.'

export const getLabelsWithCardId = async (cardId: string) => {
  return await getRepository(BoardLabelEntity).find({
    where: {
      cardId,
    },
  })
}

export const saveLabel = async (label: BoardLabelEntity) => {
  try {
    return await getRepository(BoardLabelEntity).save(label)
  } catch (error) {
    errorMessage('MODEL', 'card label', 'saveLabel', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

export const deleteLabels = async (cardId: string) => {
  try {
    return await getRepository(BoardLabelEntity).delete({cardId:cardId})
  } catch (error) {
    errorMessage('MODEL', 'card label', 'deleteLabels', error)
    throw new HttpException(500, ErrorCode[500])
  }
}