import { NextFunction, Request, Response } from 'express'
import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import {
  OrganizationEntity,
  OrganizationUserEntity,
  organizationUserModel,
  ORGANIZATION_USER_STATUS,
  TeamEntity,
  UserEntity,
  userModel,
  USER_ROLE,
} from '../../model/organization'

import { gidService } from '../../service/google'

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const organization: OrganizationEntity = req.body.organization

    const result = await organizationUserModel.getUsers(organization)
    if (!result) {
      errorMessage('CONTROLLER', 'user', 'get users')
      return next(new HttpException(500, ErrorCode[500]))
    }
    return res.status(200).send(result)
  } catch (error) {
    errorMessage('CONTROLLER', 'user', 'getUsers', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const organization: OrganizationEntity = req.body.organization
    const requester: UserEntity = req.body.requester

    const { email, id } = req.query

    if (!organization) {
      return res.status(200).send(requester)
    }

    if (email) {
      if (typeof email !== 'string') {
        errorMessage('CONTROLLER', 'user', 'invalid user email')
        return next(new HttpException(400, ErrorCode[400]))
      }
      const emailUser = await organizationUserModel.getUserWithEmail(
        organization,
        email,
      )
      if (!emailUser) {
        errorMessage('CONTROLLER', 'user', ' User(email) not found')
        return next(new HttpException(404, 'user not found'))
      }
      return res.status(200).send(emailUser)
    } else if (id) {
      if (typeof id !== 'string') {
        errorMessage('CONTROLLER', 'user', 'invalid user id')
        return next(new HttpException(400, ErrorCode[400]))
      }
      const idUser = await organizationUserModel.getUserWithId(organization, id)
      if (!idUser) {
        errorMessage('CONTROLLER', 'user', 'User(id) not found')
        return next(new HttpException(404, 'user not found'))
      }
      return res.status(200).send(idUser)
    } else {
      return res.status(200).send(requester)
    }
  } catch (error) {
    errorMessage('CONTROLLER', 'user', 'getUser', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { user, role, team } = req.body
  if (!user || (user && !user.email && !user.password) || user.id) {
    errorMessage('CONTROLLER', 'user', 'invalid user data')
    return next(new HttpException(400, ErrorCode[400]))
  }

  if (!role || !team) {
    errorMessage('CONTROLLER', 'user', 'invalid data')
    return next(new HttpException(400, ErrorCode[400]))
  }
  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    // Create Google identity platform user
    if (requester && requester.guid !== user.guid) {
      const gUserRecord = await gidService.createGoogleUser(
        user.email,
        user.password,
      )
      user.guid = gUserRecord.uid
    } else {
      user.guid = req.body.gUser.uid
    }
    // Add user to database
    const newUser: UserEntity = {
      ...user,
      createdBy: requester,
    }
    const newUserResult = await userModel.saveUser(newUser)

    // Create relation between user and organization
    if (organization) {
      const newOrganizationUser = new OrganizationUserEntity()
      newOrganizationUser.role = role
      newOrganizationUser.team = team
      newOrganizationUser.user = newUserResult
      newOrganizationUser.organization = organization
      newOrganizationUser.createdBy = requester
      await organizationUserModel.saveOrganizationUser(newOrganizationUser)
    }
    if (newUserResult)
      return res
        .status(201)
        .send(await userModel.getUserWithGUID(newUserResult.guid))
  } catch (error) {
    errorMessage('CONTROLLER', 'user', 'createUser', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user: UserEntity = req.body.user
  if (!user || !user.id) {
    errorMessage('CONTROLLER', 'user', 'invalid user data')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    // Update user to database
    const newUser: UserEntity = {
      ...user,
      updatedBy: requester,
    }
    const newUserResult = await userModel.saveUser(newUser)

    const role: USER_ROLE = req.body.role
    const team: TeamEntity = req.body.team

    if (organization && (role || team)) {
      const organizationUser = await organizationUserModel.getOrganizationUser(
        organization.id,
        newUserResult.id,
      )
      if (organizationUser) {
        if (role) {
          organizationUser.role = role
        }
        if (team) {
          organizationUser.team = team
        }
        await organizationUserModel.saveOrganizationUser(organizationUser)
      } else {
        errorMessage('CONTROLLER', 'user', 'update user(role/team)')
        return next(new HttpException(500, ErrorCode[500]))
      }
    }
      return res
        .status(201)
        .send(await userModel.getUserWithId(newUserResult.id))
  } catch (error) {
    errorMessage('CONTROLLER', 'user', 'updateUser', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  const { id } = req.query

  try {
    if (!id || typeof id !== 'string') {
      errorMessage('CONTROLLER', 'user', 'invalid parameter')
      return next(new HttpException(400, ErrorCode[400]))
    }
    const organizationUserResult = await organizationUserModel.getUserWithId(
      organization,
      id,
    )
    if (!organizationUserResult) {
      errorMessage('CONTROLLER', 'user', ' User not found')
      return next(new HttpException(404, 'user not found'))
    }

    const userResult: UserEntity = {
      ...organizationUserResult.user,
      isDelete: true,
      updatedBy: requester,
    }
    return res.status(201).send(await userModel.saveUser(userResult))
  } catch (error) {
    errorMessage('CONTROLLER', 'user', 'deleteUser', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const addUserToOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email } = req.body
  if (!email) {
    errorMessage(
      'CONTROLLER',
      'user.addUserToOrganization',
      'invalid user data(email)',
    )
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    let newUserResult = await userModel.getUserWithEmail(email)
    if (!newUserResult) {
      // Add temporary user to database
      const newUser: UserEntity = {
        ...new UserEntity(),
        email,
        createdBy: requester,
      }
      newUserResult = await userModel.saveUser(newUser)
    }

    // Create relation between user and organization
    if (organization) {
      const newOrganizationUser: OrganizationUserEntity = {
        ...new OrganizationUserEntity(),
        role: USER_ROLE.AGENT,
        user: newUserResult,
        status: ORGANIZATION_USER_STATUS.PADDING,
        organization,
        createdBy: requester,
      }
      await organizationUserModel.saveOrganizationUser(newOrganizationUser)
    }
    if (newUserResult)
      return res
        .status(201)
        .send(await userModel.getUserWithEmail(newUserResult.email))
  } catch (error) {
    errorMessage('CONTROLLER', 'user', 'addUserToOrganization', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}
export const removeUserFromOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  const { id } = req.query

  try {
    if (!id || typeof id !== 'string') {
      errorMessage('CONTROLLER', 'user', 'invalid parameter')
      return next(new HttpException(400, ErrorCode[400]))
    }
    const organizationUserResult = await organizationUserModel.getUserWithId(
      organization,
      id,
    )
    if (!organizationUserResult) {
      errorMessage('CONTROLLER', 'user', ' User not found')
      return next(new HttpException(404, 'user not found'))
    }
    return res
      .status(201)
      .send(
        await organizationUserModel.deleteOrganizationUser(
          organizationUserResult.id,
        ),
      )
  } catch (error) {
    errorMessage('CONTROLLER', 'user', 'removeUserFromOrganization', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}
