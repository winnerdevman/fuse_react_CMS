import { NextFunction, Request, Response } from 'express'
import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { gcsService } from '../../service/google'
import { OrganizationEntity, UserEntity } from '../../model/organization'

import { CustomerEntity, customerModel } from '../../model/customer'

export const getCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const organization: OrganizationEntity = req.body.organization
    const result = await customerModel.getCustomers(organization)
    if (!result) {
      errorMessage('CONTROLLER', 'customer', 'get customers')
      return next(new HttpException(500, ErrorCode[500]))
    }
    return res.status(200).send(result)
  } catch (error) {
    errorMessage('CONTROLLER', 'customer', 'getCustomers', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const getCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const organization: OrganizationEntity = req.body.organization

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      errorMessage('CONTROLLER', 'customer', 'invalid parameter(id)')
      return next(new HttpException(400, ErrorCode[400]))
    }

    const result = await customerModel.getCustomerWithId(id, organization)
    if (!result) {
      errorMessage('CONTROLLER', 'customer', 'customer not found')
      return next(new HttpException(404, 'customer not found'))
    }

    if(result && result.picture){
      const picture =  gcsService.getCustomerDisplayURL(
        organization.id,
        result.channel.id,
        result.uid,
        result.picture)
      return res.status(200).send( {
        ...result,
        pictureURL: picture,
        })
    }

    return res.status(200).send(result)
  } catch (error) {
    errorMessage('CONTROLLER', 'customer', 'getCustomer', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { customer } = req.body
  if (!customer || customer.id) {
    errorMessage('CONTROLLER', 'customer', 'invalid data(customer)')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    // Add customer to database
    const newCustomer: CustomerEntity = {
      ...customer,
      organization,
      createdBy: requester,
    }
    return res.status(201).send(await customerModel.saveCustomer(newCustomer))
  } catch (error) {
    errorMessage('CONTROLLER', 'customer', 'createCustomer', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { customer } = req.body
  if (!customer || !customer.id) {
    errorMessage('CONTROLLER', 'customer', 'invalid data(customer)')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  let newLabel = customer.customerLabel
  if(customer  && customer.customerLabel  && customer.customerLabel.length > 0 ){
    newLabel = await customer.customerLabel.map((label: any)=> {
      if(!label.id){
        label.organization = organization
        label.createdBy = requester
      }
      return label
    })
  }

  try {
    // Save customer to database
    const newCustomer: CustomerEntity = {
      ...customer,
      customerLabel: newLabel,
      organization,
      updatedBy: requester,
    }
    return res.status(201).send(await customerModel.saveCustomer(newCustomer))
  } catch (error) {
    errorMessage('CONTROLLER', 'customer', 'updateCustomer', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    errorMessage('CONTROLLER', 'customer', 'invalid parameter(id)')
    return next(new HttpException(400, ErrorCode[400]))
  }

  const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    const customerResult = await customerModel.getCustomerWithId(
      id,
      organization,
    )
    if (!customerResult) {
      errorMessage('CONTROLLER', 'customer', ' customer not found')
      return next(new HttpException(404, 'customer not found'))
    }
    // Save customer to database
    const newCustomer: CustomerEntity = {
      ...customerResult,
      isDelete: true,
      updatedBy: requester,
    }
    return res.status(201).send(await customerModel.saveCustomer(newCustomer))
  } catch (error) {
    errorMessage('CONTROLLER', 'customer', 'deleteCustomer', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}
