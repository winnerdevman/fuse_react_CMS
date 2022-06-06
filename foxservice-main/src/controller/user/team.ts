import { NextFunction, Request, Response } from 'express'
import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import {
  OrganizationEntity,
  TeamEntity,
  teamModel,
  UserEntity,
} from '../../model/organization'

export const getTeams = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const organization: OrganizationEntity = req.body.organization

    const result = await teamModel.getTeams(organization)
    if (!result) {
      errorMessage('CONTROLLER', 'team', 'get teams')
      return next(new HttpException(500, ErrorCode[500]))
    }
    return res.status(200).send(result)
  } catch (error) {
    errorMessage('CONTROLLER', 'team', 'getTeams', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const getTeam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const organization: OrganizationEntity = req.body.organization

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      errorMessage('CONTROLLER', 'team', 'invalid parameter')
      return next(new HttpException(400, ErrorCode[400]))
    }

    const result = await teamModel.getTeamWithId(id, organization)
    if (!result) {
      errorMessage('CONTROLLER', 'team', 'team not found')
      return next(new HttpException(404, 'team not found'))
    }
    return res.status(200).send(result)
  } catch (error) {
    errorMessage('CONTROLLER', 'team', 'getTeam', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const createTeam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { team } = req.body
  if (!team || team.id) {
    errorMessage('CONTROLLER', 'team', 'invalid data')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    // Add team to database
    const newTeam: TeamEntity = {
      ...team,
      organization,
      createdBy: requester,
    }
    return res.status(201).send(await teamModel.saveTeam(newTeam))
  } catch (error) {
    errorMessage('CONTROLLER', 'team', 'createTeam', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const updateTeam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { team } = req.body
  if (!team || !team.id) {
    errorMessage('CONTROLLER', 'team', 'invalid data')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    // Save team to database
    const newTeam: TeamEntity = {
      ...team,
      organization,
      updatedBy: requester,
    }
    return res.status(201).send(await teamModel.saveTeam(newTeam))
  } catch (error) {
    errorMessage('CONTROLLER', 'user', 'updateTeam', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const deleteTeam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    errorMessage('CONTROLLER', 'team', 'invalid parameter')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    const result = await teamModel.getTeamWithId(id, organization)
    if (!result) {
      errorMessage('CONTROLLER', 'team', ' Team not found')
      return next(new HttpException(404, 'team not found'))
    }
    // Save team to database
    const newTeam: TeamEntity = {
      ...result,
      isDelete: true,
      updatedBy: requester,
    }
    return res.status(201).send(await teamModel.saveTeam(newTeam))
  } catch (error) {
    errorMessage('CONTROLLER', 'tram', 'deleteTeam', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}
