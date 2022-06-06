import { NextFunction, Request, Response } from 'express'
import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { OrganizationEntity, UserEntity } from '../../model/organization'

import { CustomerLabelEntity, labelModel } from '../../model/customer'

export const getLabels = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const organization: OrganizationEntity = req.body.organization
    const result = await labelModel.getLabels(organization)
    if (!result) {
      errorMessage('CONTROLLER', 'label', 'get labels')
      return next(new HttpException(500, ErrorCode[500]))
    }
    return res.status(200).send(result)
  } catch (error) {
    errorMessage('CONTROLLER', 'label', 'getLabels', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const getLabel = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const organization: OrganizationEntity = req.body.organization

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      errorMessage('CONTROLLER', 'label', 'invalid parameter(id)')
      return next(new HttpException(400, ErrorCode[400]))
    }

    const result = await labelModel.getLabelWithId(id, organization)
    if (!result) {
      errorMessage('CONTROLLER', 'label', 'label not found')
      return next(new HttpException(404, 'label not found'))
    }
    return res.status(200).send(result)
  } catch (error) {
    errorMessage('CONTROLLER', 'label', 'getLabel', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const createLabels = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { labels } = req.body
  if (!labels || labels.length < 1) {
    errorMessage('CONTROLLER', 'label', 'invalid data(label)')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    // Add labels to database
    const newLabels: CustomerLabelEntity[] = []
    labels.forEach((element: string) => {
      const newLabel = new CustomerLabelEntity()
      newLabel.organization = organization
      newLabel.label = element
      newLabel.createdBy = requester
      newLabels.push(newLabel)
    })
    return res.status(201).send(await labelModel.saveLabels(newLabels))
  } catch (error) {
    errorMessage('CONTROLLER', 'label', 'createLabels', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const updateLabel = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { label } = req.body
  if (!label || !label.id) {
    errorMessage('CONTROLLER', 'label', 'invalid data(label)')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    // Save label to database
    const newLabel: CustomerLabelEntity = {
      ...label,
      organization,
      updatedBy: requester,
    }
    return res.status(201).send(await labelModel.saveLabels([newLabel]))
  } catch (error) {
    errorMessage('CONTROLLER', 'label', 'updateLabel', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}
