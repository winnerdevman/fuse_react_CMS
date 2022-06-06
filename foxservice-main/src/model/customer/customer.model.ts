import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository } from 'typeorm'
import { OrganizationEntity, TeamEntity } from '../organization'
import { CustomerEntity } from '.'
import { ChannelEntity } from '../channel'

export const getCustomers = async (organization: OrganizationEntity) => {
  return await getRepository(CustomerEntity).find({
    where: {
      isDelete: false,
      organization,
    },
    relations: ['createdBy', 'updatedBy', 'channel','channel.line','channel.facebook','chat'],
  })
}

export const getCustomerWithId = async (
  id: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(CustomerEntity).findOne({
    where: {
      id,
      isDelete: false,
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'address',
      'customerLabel',
      'pointLog',
      'rewardLog',
      'channel','channel.line','channel.facebook',
      'chat','chat.message',
    ],
  })
}

export const getCustomerWithUidAndChannel = async (
  uid: string,
  channel: ChannelEntity,
  organization: OrganizationEntity,
) => {
  return await getRepository(CustomerEntity).findOne({
    where: {
      uid,
      channel: {
        id: channel.id,
      },
      organization,
    },
    relations: [
      'createdBy',
      'updatedBy',
      'address',
      'customerLabel',
      'pointLog',
      'rewardLog',
      'channel',
    ],
  })
}

export const saveCustomer = async (customer: CustomerEntity) => {
  try {
    return await getRepository(CustomerEntity).save(customer)
  } catch (error) {
    errorMessage('MODEL', 'customer', 'saveCustomer', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
