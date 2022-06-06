import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { getRepository } from 'typeorm'

import { ActivationEntity, OrganizationEntity, PackageEntity } from '.'

export const getActivations = async () => {
  return await getRepository(ActivationEntity).find({
    relations: ['createdBy', 'organization', 'package'],
  })
}

export const getActivationWithId = async (id: string) => {
  return await getRepository(PackageEntity).findOne({
    where: {
      id,
    },
    relations: ['createdBy', 'organization', 'package'],
  })
}

export const getActivationWithOrganization = async (
  organization: OrganizationEntity,
) => {
  return await getRepository(OrganizationEntity).find({
    where: {
      organization,
    },
    relations: ['createdBy', 'organization', 'package'],
  })
}

export const saveActivation = async (activation: ActivationEntity) => {
  try {
    return await getRepository(ActivationEntity).save(activation)
  } catch (error) {
    errorMessage('MODEL', 'activation', 'saveActivation', error)
    throw new HttpException(500, ErrorCode[500])
  }
}
