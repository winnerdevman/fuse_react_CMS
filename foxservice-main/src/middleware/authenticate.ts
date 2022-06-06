import { NextFunction, Request, Response } from 'express'
import { UserEntity } from '../model/organization/'
import { gidService } from '../service/google'
import { ErrorCode, errorMessage, HttpException } from './exceptions'
import {
  organizationModel,
  organizationUserModel,
  userModel,
} from '../model/organization'

// Verify the Google Identity platform Token
export const verifyGoogleToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const bearer = authHeader.split(' ')[1]
      const decodedToken = await gidService.verifyToken(bearer)
      if (!decodedToken) {
        errorMessage('VERIFY', 'authenticate', 'verify token')
        next(new HttpException(401, ErrorCode[401]))
      }

      let name = ['']
      if (decodedToken.name) {
        name = decodedToken.name.split(' ')
      }

      // Get Customer profile from Database
      let result = decodedToken.email
        ? await userModel.getUserWithEmail(decodedToken.email)
        : await userModel.getUserWithGUID(decodedToken.uid)
      if (!result) {
        // Create new customer profile
        // Create new user with data from google identity platform
        const user = new UserEntity()
        user.guid = decodedToken.uid
        user.email = decodedToken.email ? decodedToken.email : ''
        user.display = decodedToken.email ? decodedToken.email : ''
        user.firstname = name.length === 2 ? name[0] : ''
        user.lastname = name.length === 2 ? name[1] : ''
        result = await userModel.saveUser(user)
        if (!result) {
          errorMessage('VERIFY', 'authenticate', 'create new user')
          next(new HttpException(500, 'create new user'))
        }
      } else {
        // Update User
        if (!result.guid) {
          result = await userModel.saveUser({
            ...result,
            guid: decodedToken.uid,
            email: result.email
              ? result.email
              : decodedToken.email
              ? decodedToken.email
              : '',
            firstname: result.firstname
              ? result.firstname
              : name.length === 2
              ? name[0]
              : '',
            lastname: result.lastname
              ? result.lastname
              : name.length === 2
              ? name[1]
              : '',
            display: result.display
              ? result.display
              : decodedToken.email
              ? decodedToken.email
              : '',
          })
          if (!result) {
            errorMessage('VERIFY', 'authenticate', 'update new user')
            next(new HttpException(500, 'update user'))
          }
        }
      }
      // Set user profile to body
      req.body.requester = result
      next()
    } catch (error: any) {
      errorMessage('VERIFY', 'authenticate', 'verifyToken', error)
      if (error.code) {
        next(new HttpException(500, error.code))
      }
      next(new HttpException(500, ErrorCode[500]))
    }
  } else {
    errorMessage('VERIFY', 'authenticate', 'Missing authorization header')
    next(new HttpException(400, 'missing authorization header'))
  }
}

export const verifyOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user: UserEntity = req.body.requester
    const { organizationId } = req.params
    if (!organizationId) {
      errorMessage('VERIFY', 'authenticate', 'missing organization value')
      return next(new HttpException(400, 'missing organization value'))
    }

    const result = await organizationModel.getOrganizationWithId(organizationId)
    if (!result) {
      errorMessage('VERIFY', 'authenticate', 'Organization not found')
      return next(new HttpException(404, 'Organization not found'))
    }

    // Verify User in Organization
    const organizationUser = await organizationUserModel.getOrganizationUser(
      organizationId,
      user.id,
    )
    if (!organizationUser) {
      errorMessage('VERIFY', 'authenticate', 'user unauthorized')
      return next(new HttpException(401, ErrorCode[401]))
    }
    req.body.organization = await result
    next()
  } catch (error) {
    errorMessage('VERIFY', 'authenticate', 'Verify Organization', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}
