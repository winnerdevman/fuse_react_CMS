import { NextFunction, Request, Response } from 'express'

import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import {
  OrganizationEntity,
  organizationModel,
  OrganizationUserEntity,
  organizationUserModel,
  UserEntity,
  USER_ROLE,
} from '../../model/organization'

export const getOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const requester: UserEntity = req.body.requester
    const result = await organizationUserModel.getOrganizations(requester)
    if (!result) {
      errorMessage('CONTROLLER', 'organization', 'get organizations')
      return next(new HttpException(500, ErrorCode[500]))
    }
    return res.status(200).send(result)
  } catch (error) {
    errorMessage('CONTROLLER', 'organization', 'getOrganizations', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const getOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id, name } = req.query
    if (!id && !name) {
      errorMessage('CONTROLLER', 'organization', 'invalid parameter')
      return next(new HttpException(400, ErrorCode[400]))
    }

    const requester: UserEntity = req.body.requester

    if (id && typeof id === 'string') {
      const idResult = await organizationUserModel.getOrganizationWithId(
        requester,
        id,
      )
      if (!idResult) {
        errorMessage('CONTROLLER', 'organization', 'organization(id) not found')
        return next(new HttpException(404, 'organization not found'))
      }
      return res.status(200).send(idResult)
    } else if (name && typeof name === 'string') {
      const nameResult = await organizationUserModel.getOrganizationWithName(
        requester,
        name,
      )
      if (!nameResult) {
        errorMessage(
          'CONTROLLER',
          'organization',
          'organization(name) not found',
        )
        return next(new HttpException(404, 'organization not found'))
      }
      return res.status(200).send(nameResult)
    }
    // errorMessage('CONTROLLER', 'organization', 'organization not found')
    // return next(new HttpException(404, 'organization not found'))
  } catch (error) {
    errorMessage('CONTROLLER', 'organization', 'getOrganization', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const createOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { organization } = req.body
  if (!organization || organization.id) {
    errorMessage('CONTROLLER', 'organization', 'invalid data')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const requester: UserEntity = req.body.requester

  try {
    // Add Organization to database
    const newOrganization: OrganizationEntity = {
      ...new OrganizationEntity(),
      ...organization,
      createdBy: requester,
    }
    const newOrganizationResult = await organizationModel.saveOrganization(
      newOrganization,
    )

    // Create relation between user and organization
    const newOrganizationUser = new OrganizationUserEntity()
    newOrganizationUser.role = USER_ROLE.ADMIN
    newOrganizationUser.user = requester
    newOrganizationUser.organization = newOrganizationResult
    newOrganizationUser.createdBy = requester
    const organizationUserResult =
      await organizationUserModel.saveOrganizationUser(newOrganizationUser)

    // Add Requester to admin at new Organization
    return res.status(201).send(organizationUserResult)
  } catch (error) {
    errorMessage('CONTROLLER', 'organization', 'createOrganization', error)
    return next(new HttpException(400, ErrorCode[400]))
  }
}

export const updateOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { organization } = req.body
  if (!organization || !organization.id) {
    errorMessage('CONTROLLER', 'organization', 'invalid data')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const requester: UserEntity = req.body.requester

  try {
    // Save organization to database
    const newOrganization: OrganizationEntity = {
      ...organization,
      updatedBy: requester,
    }
    return res
      .status(201)
      .send(await organizationModel.saveOrganization(organization))
  } catch (error) {
    errorMessage('CONTROLLER', 'organization', 'updateOrganization', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const deleteOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    errorMessage('CONTROLLER', 'organization', 'invalid parameter')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const requester: UserEntity = req.body.requester

  try {
    const organizationUserResult =
      await organizationUserModel.getOrganizationWithId(requester, id)
    if (!organizationUserResult) {
      errorMessage('CONTROLLER', 'organization', ' Organization not found')
      return next(new HttpException(404, 'organization not found'))
    }
    // Save organization to database
    const newOrganization: OrganizationEntity = {
      ...organizationUserResult.organization,
      isDelete: true,
      updatedBy: requester,
    }
    return res
      .status(201)
      .send(await organizationModel.saveOrganization(newOrganization))
  } catch (error) {
    errorMessage('CONTROLLER', 'organization', 'deleteORganization', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}
