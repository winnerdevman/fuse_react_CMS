import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository, Not } from 'typeorm'
import { OrganizationEntity, TeamEntity } from '../organization'
import { ChannelEntity, CHANNEL_STATUS } from '.'
import { CHANNEL } from './channel.entity'

export const getChannels = async (organization: OrganizationEntity) => {
  return await getRepository(ChannelEntity).find({
    where: {
      isDelete: false,
      organization,
    },
    relations: ['createdBy', 'updatedBy', 'facebook', 'line'],
  })
}

export const getChannelWithId = async (
  id: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(ChannelEntity).findOne({
    where: {
      id,
      isDelete: false,
      organization,
    },
    relations: ['createdBy', 'updatedBy', 'facebook', 'line'],
  })
}

// This api for Webhook only
export const getChannelWithIdAndOnOrganization = async (id: string) => {
  return await getRepository(ChannelEntity).findOne({
    where: {
      id,
      isDelete: false,
    },
    relations: ['createdBy', 'updatedBy', 'facebook', 'line', 'organization'],
  })
}

export const getFacebookChannelWithPageId = async (
  pageId: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(ChannelEntity).findOne({
    where: {
      facebook: {
        pageId,
      },
      channel: CHANNEL.FACEBOOK,
      isDelete: false,
      organization,
    },
    relations: ['createdBy', 'updatedBy', 'facebook'],
  })
}

export const getDeleteFacebookChannelWithPageId = async (
  pageId: string,
) => {
  return await getRepository(ChannelEntity).findOne({
    where: {
      facebook: {
        pageId,
      },
      channel: CHANNEL.FACEBOOK,
      isDelete: true,
    },
    relations: ['createdBy', 'updatedBy', 'facebook'],
  })
}

// This api for Webhook only
export const getFacebookChannelWithPageIdAndOnOrganization = async (
  pageId: string,
) => {
  return await getRepository(ChannelEntity).findOne({
    where: {
      facebook: {
        pageId,
      },
      channel: CHANNEL.FACEBOOK,
      status: CHANNEL_STATUS.ACTIVE,
    },
    relations: ['createdBy', 'updatedBy', 'facebook', 'organization'],
  })
}

export const getLineChannelWithChannelId = async (
  channelId: string,
  organization: OrganizationEntity,
) => {
  return await getRepository(ChannelEntity).findOne({
    where: {
      id: channelId,
      channel: CHANNEL.LINE,
      isDelete: false,
      organization,
    },
    relations: ['createdBy', 'updatedBy', 'line'],
  })
}

export const getDeleteLineChannelWithChannelSecret = async (
  channelSecret: string,
) => {
  return await getRepository(ChannelEntity).findOne({
    where: {
      line:{
        channelSecret,
      },
      channel: CHANNEL.LINE,
      isDelete: true,
    },
    relations: ['createdBy', 'updatedBy', 'line'],
  })
}

export const saveChannel = async (channel: ChannelEntity) => {
  try {
    return await getRepository(ChannelEntity).save(channel)
  } catch (error) {
    errorMessage('MODEL', 'channel', 'saveChannel', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
