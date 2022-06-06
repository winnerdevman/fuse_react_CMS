import * as admin from 'firebase-admin'
import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../middleware/exceptions'

import {
  ChatEntity,
  MessageEntity,
  MESSAGE_TYPE,
  TC_MESSAGE_TYPE,
} from '../model/chat'
import {
  notificationSettingModel,
  NotificationUserEntity,
  notificationUserModel,
} from '../model/notification'
import {
  NotificationEntity,
  notificationModel,
  NotificationSettingEntity,
} from '../model/notification/'
import { organizationUserModel, UserEntity } from '../model/organization'
import { TeamChatEntity } from '../model/chat'
import { OrganizationEntity } from '../model/organization/organization.entity'
import { CHANNEL } from '../model/channel'

// Send messages to specific devices
const sendNotificationToSpecificUser = (
  setting: NotificationSettingEntity,
  notification: NotificationEntity,
) => {
  // This registration token comes from the client FCM SDKs.
  // const registrationTokens = setting.token
  const message: admin.messaging.Message = {
    // data: JSON.parse(notification.data),
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: {
      organization: notification.organization.name,
      createdAt: notification.createdAt.getTime().toString(),
    },
    token: setting.token,
  }
  try {
    admin.messaging().send(message)
  } catch (error) {
    errorMessage(
      'UTIL',
      'notification',
      'sendNotificationToSpecificUser',
      error,
    )
    throw new HttpException(500, ErrorCode[500])
  }
}
// Send messages to multiple devices
const sendNotificationToMultiUser = (
  settings: NotificationSettingEntity[],
  notification: NotificationEntity,
) => {
  // Create a list containing up to 500 registration tokens.
  // These registration tokens come from the client FCM SDKs.
  if (settings.length > 500) {
    errorMessage(
      'UTIL',
      'notification',
      'Notification sent error registrationTokens more then 500',
    )
    throw new HttpException(400, ErrorCode[400])
  }

  const registrationTokens = settings.map((item) => item.token)
  const messages: admin.messaging.MulticastMessage = {
    // data: JSON.parse(notification.data),
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: {
      organization: notification.organization.name,
      createdAt: notification.createdAt.toDateString(),
    },
    tokens: registrationTokens,
  }

  try {
    admin.messaging().sendMulticast(messages)
  } catch (error) {
    errorMessage('UTIL', 'notification', 'sendNotificationToMultiUser', error)
    throw new HttpException(500, ErrorCode[500])
  }
}

const createNotificationUsers = async (
  users: UserEntity[],
  notification: NotificationEntity,
) => {
  const notificationUserList: NotificationUserEntity[] = await users.map(
    (user) => {
      return {
        isRead: false,
        notification,
        organization: notification.organization,
        user,
      } as NotificationUserEntity
    },
  )
  const newNotificationUser = await notificationUserModel.saveNotificationUsers(
    notificationUserList,
  )
  return newNotificationUser
}

export const notificationNewChat = async (chat: ChatEntity) => {
  console.log('Send notification New Chat')
  try {
    // Get List of user email in this organization
    const usersInOrganization = await organizationUserModel.getUsers(
      chat.organization,
    )
    const userEmailList = usersInOrganization.map((el) => el.user.email)
    const settings =
      await notificationSettingModel.getMentionNotificationSettingsWithEmailList(
        userEmailList,
      )
    const settingsChat = settings.filter((setting) => setting.chat)

    if (!settingsChat || settingsChat.length < 1) {
      console.warn('[UTIL][notification] notification setting not found')
      return
    }

    const users = settingsChat.map((item) => item.user)

    const customerName =
      chat.customer.firstname && chat.customer.lastname
        ? `${chat.customer.firstname} ${chat.customer.lastname}`
        : `${chat.customer.display}`

    let channelName = ''
    if (chat.channel.channel === CHANNEL.LINE && chat.channel.line) {
      channelName = chat.channel.line.name
    }
    if (chat.channel.channel === CHANNEL.FACEBOOK && chat.channel.facebook) {
      channelName = chat.channel.facebook.name
    }

    // Create Notification
    const newNotification: NotificationEntity = {
      ...new NotificationEntity(),
      organization: chat.organization,
      title: 'Fox connect',
      body: `New Chat from ${customerName}`,
      data: JSON.stringify({
        title: `New Chat: ${customerName}`,
        body: `${channelName}`,
        createdAt: String(chat.createdAt),
        type: 'chat',
        chatId: String(chat.id),
      }),
    }

    const notification = await notificationModel.saveNotification(
      newNotification,
    )

    await createNotificationUsers(users, notification)
    sendNotificationToMultiUser(settingsChat, notification)
    return
  } catch (error) {
    errorMessage('UTIL', 'notification', 'notificationNewChat', error)
    // throw new HttpException(500, ErrorCode[500])
    return
  }
}

export const notificationNewMessage = async (message: MessageEntity) => {
  try {
    console.log('Send notification new Message')
    if (!message.chat.owner) {
      return
    }
    const setting =
      await notificationSettingModel.getNotificationSettingWithUserId(
        message.chat.owner.id,
      )

    if (!setting || !setting.chat) {
      console.warn('[UTIL][notification] notification setting not found')
      return
    }

    let messageText = ''
    switch (message.type) {
      case MESSAGE_TYPE.TEXT:
      case MESSAGE_TYPE.LOCATION:
        messageText = message.data ? JSON.parse(message.data).text : 'Send Text'
        break
      case MESSAGE_TYPE.STICKER:
        messageText = 'Send Sticker'
        break
      case MESSAGE_TYPE.IMAGE:
      case MESSAGE_TYPE.VIDEO:
        messageText = 'Send Media'
        break
      default:
        messageText = 'Send Unknown Type'
        break
    }

    const customerName =
      message.chat.customer.firstname && message.chat.customer.lastname
        ? `${message.chat.customer.firstname} ${message.chat.customer.lastname}`
        : `${message.chat.customer.display}`

    // Create Notification
    const newNotification: NotificationEntity = {
      ...new NotificationEntity(),
      organization: message.organization,
      title: 'Fox connect',
      body: `${customerName} send a new message: "${messageText}"`,
      data: JSON.stringify({
        title: `New Message: ${customerName}`,
        body: `${messageText}`,
        type: 'message',
        createdAt: String(message.createdAt),
        chatId: String(message.chat.id),
      }),
    }

    const notification = await notificationModel.saveNotification(
      newNotification,
    )

    await createNotificationUsers([message.chat.owner], notification)
    if (
      message.type === MESSAGE_TYPE.TEXT ||
      message.type === MESSAGE_TYPE.LOCATION
    ) {
      sendNotificationToSpecificUser(setting, notification)
    } else {
      setTimeout(() => {
        sendNotificationToSpecificUser(setting, notification)
      }, 300)
    }
  } catch (error) {
    errorMessage('UTIL', 'notification', 'notificationNewMessage', error)
    // throw new HttpException(500, ErrorCode[500])
    return
  }
}

export const notificationTeamChatMention = async (
  userEmailList: string[],
  teamChat: TeamChatEntity,
) => {
  console.log('Send notification new TeamChat')
  const settings =
    await notificationSettingModel.getMentionNotificationSettingsWithEmailList(
      userEmailList,
    )

  const settingsMention = settings.filter((setting) => setting.mention)
  if (!settingsMention || settingsMention.length < 1) {
    console.warn('[UTIL][notification] notification setting not found')
    return
  }

  const users = settingsMention.map((item) => item.user)

  let messageText = ''
  switch (teamChat.type) {
    case TC_MESSAGE_TYPE.TEXT:
      messageText = teamChat.data ? JSON.parse(teamChat.data).text : 'Send Text'
      break
    case TC_MESSAGE_TYPE.IMAGE:
      messageText = 'Send Image'
      break
    default:
      messageText = 'Send Unknown Type'
      break
  }

  // Create Notification
  const newNotification: NotificationEntity = {
    ...new NotificationEntity(),
    organization: teamChat.organization,
    title: 'Fox connect',
    body: `New mention you on Team Chat`,
    data: JSON.stringify({
      title: `New mention you on Team Chat`,
      body: `${messageText}`,
      createdAt: String(teamChat.createdAt),
      type: 'teamChat',
    }),
  }

  const notification = await notificationModel.saveNotification(newNotification)

  await createNotificationUsers(users, notification)
  sendNotificationToMultiUser(settingsMention, notification)
  return
}

export const notificationNewChatOwner = async (chat: ChatEntity) => {
  console.log('Send notification New Chat Owner')
  try {
    const setting =
      await notificationSettingModel.getNotificationSettingWithUserId(
        chat.owner.id,
      )

    if (!setting || !setting.chat) {
      console.warn('[UTIL][notification] notification setting not found')
      return
    }

    const customerName =
      chat.customer.firstname && chat.customer.lastname
        ? `${chat.customer.firstname} ${chat.customer.lastname}`
        : `${chat.customer.display}`

    let channelName = ''
    if (chat.channel.channel === CHANNEL.LINE && chat.channel.line) {
      channelName = chat.channel.line.name
    }
    if (chat.channel.channel === CHANNEL.FACEBOOK && chat.channel.facebook) {
      channelName = chat.channel.facebook.name
    }

    // Create Notification
    const newNotification: NotificationEntity = {
      ...new NotificationEntity(),
      organization: chat.organization,
      title: 'Fox connect',
      body: `New Chat assign to you.`,
      data: JSON.stringify({
        title: `Chat: ${customerName}`,
        body: `${channelName}`,
        createdAt: String(chat.createdAt),
        type: 'chat',
        chatId: String(chat.id),
      }),
    }

    const notification = await notificationModel.saveNotification(
      newNotification,
    )

    await createNotificationUsers([chat.owner], notification)
    sendNotificationToSpecificUser(setting, notification)
    return
  } catch (error) {
    errorMessage('UTIL', 'notification', 'notificationNewChatOwner', error)
    // throw new HttpException(500, ErrorCode[500])
    return
  }
}

export const notificationNewEvent = async (
  organization: OrganizationEntity,
) => {
  console.log('Send notification Event')
  try {
    // Get List of user email in this organization
    const usersInOrganization = await organizationUserModel.getUsers(
      organization,
    )
    const userEmailList = usersInOrganization.map((el) => el.user.email)
    const settings =
      await notificationSettingModel.getMentionNotificationSettingsWithEmailList(
        userEmailList,
      )
    const settingsChat = settings.filter((setting) => setting.chat)

    if (!settingsChat || settingsChat.length < 1) {
      console.warn('[UTIL][notification] notification setting not found')
      return
    }

    const users = settingsChat.map((item) => item.user)

    // Create Notification
    const newNotification: NotificationEntity = {
      ...new NotificationEntity(),
      organization,
      title: 'Fox connect',
      body: `New Event`,
      data: JSON.stringify({
        title: `NewEvent`,
        body: `trigger event`,
        createdAt: new Date(),
        type: 'event',
      }),
    }

    const notification = await notificationModel.saveNotification(
      newNotification,
    )

    // await createNotificationUsers(users, notification)
    sendNotificationToMultiUser(settingsChat, notification)
    return
  } catch (error) {
    errorMessage('UTIL', 'notification', 'notificationNewEvent', error)
    // throw new HttpException(500, ErrorCode[500])
    return
  }
}
