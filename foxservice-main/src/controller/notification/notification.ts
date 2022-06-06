import { NextFunction, Request, Response } from 'express'
import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import {
  NotificationSettingEntity,
  notificationSettingModel,
  NotificationUserEntity,
  notificationUserModel,
} from '../../model/notification'
import { OrganizationEntity, UserEntity } from '../../model/organization'

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // const organization: OrganizationEntity = req.body.organization
    const requester: UserEntity = req.body.requester

    const result = await notificationUserModel.getNotificationUserWithUserId(
      requester.id,
      // organization,
    )
    if (!result) {
      errorMessage('CONTROLLER', 'notification', 'get notification with user')
      return next(new HttpException(500, ErrorCode[500]))
    }

    return res.status(200).send(result)
  } catch (error) {
    errorMessage('CONTROLLER', 'keyword', 'getNotifications', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const markReadNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    const settingResult =
      await notificationUserModel.getNotificationUserWithUserId(
        requester.id,
        // organization,
      )

    const newSetting: NotificationUserEntity[] = await settingResult.map(
      (item) => {
        item.isRead = true
        item.updatedBy = requester
        return item
      },
    )
    return res
      .status(201)
      .send(await notificationUserModel.saveNotificationUsers(newSetting))
  } catch (error) {
    errorMessage('CONTROLLER', 'notification', 'markReadNotifications', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}
export const markReadNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { notificationId } = req.body
  if (!notificationId || typeof notificationId !== 'string') {
    errorMessage(
      'CONTROLLER',
      'notification',
      'invalid parameter(notificationId)',
    )
    return next(new HttpException(400, ErrorCode[400]))
  }

  // const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    const result = await notificationUserModel.getNotificationUserWithId(
      notificationId,
      // organization,
    )
    if (!result) {
      errorMessage('CONTROLLER', 'notification', 'notification not found')
      return next(new HttpException(404, 'notification not found'))
    }
    const newSetting: NotificationUserEntity = {
      ...result,
      isRead: true,
      updatedBy: requester,
    }
    return res
      .status(201)
      .send(await notificationUserModel.saveNotificationUser(newSetting))
  } catch (error) {
    errorMessage('CONTROLLER', 'notification', 'markReadNotification', error)
    return next(new HttpException(500, ErrorCode[500]))
  }
}

export const updateNotificationSetting = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { setting } = req.body
  if (!setting || !setting.token) {
    errorMessage('CONTROLLER', 'notification', 'invalid data(token)')
    return next(new HttpException(400, ErrorCode[400]))
  }

  // const organization: OrganizationEntity = req.body.organization
  const requester: UserEntity = req.body.requester

  try {
    const oldSetting = await notificationSettingModel.getNotificationSettingWithUserId(requester.id)
    if(!oldSetting){
      // Save notification setting to database
      const newSetting: NotificationSettingEntity = {
        ...setting,
        user:requester,
        createdBy: requester
      }
      return res
        .status(201)
        .send(await notificationSettingModel.saveNotificationSetting(newSetting))
    }else{
      // Update notification setting to database
      const newSetting: NotificationSettingEntity = {
        ...oldSetting,
        ...setting,
        updatedBy: requester
      }
      return res
        .status(201)
        .send(await notificationSettingModel.saveNotificationSetting(newSetting))
    }

  } catch (error) {
    errorMessage(
      'CONTROLLER',
      'notification',
      'updateNotificationSetting',
      error,
    )
    return next(new HttpException(500, ErrorCode[500]))
  }
}
