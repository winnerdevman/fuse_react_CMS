import { NextFunction, Request, Response } from 'express'
import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import {
  ActivationEntity,
  activationModel,
  OrganizationEntity,
  organizationUserModel,
  PackageEntity,
  packageModel,
  UserEntity,
  USER_ROLE,
} from '../../model/organization'

export const getActivations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await activationModel.getActivations()
    if (!result) {
      errorMessage('CONTROLLER', 'activation', 'get activations')
      return next(new HttpException(500, ErrorCode[500]))
    }
    return res.status(200).send(result)
  } catch (error) {
    errorMessage('CONTROLLER', 'activation', 'getActivations', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const getActivation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.query
    if (!id || typeof id !== 'string') {
      errorMessage('CONTROLLER', 'activation', 'invalid parameter')
      return next(new HttpException(400, ErrorCode[400]))
    }

    const result = await packageModel.getPackageWithId(id)
    if (!result) {
      errorMessage('CONTROLLER', 'activation', 'activation not found')
      return next(new HttpException(404, 'activation not found'))
    }
    return res.status(200).send(result)
  } catch (error) {
    errorMessage('CONTROLLER', 'activation', 'getActivation', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}
