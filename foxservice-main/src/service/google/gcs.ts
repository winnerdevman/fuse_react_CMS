import { Storage } from '@google-cloud/storage'
import axios from 'axios'
import { ChannelEntity } from '../../model/channel/channel.entity'
import { ReplyEntity } from '../../model/reply/reply.entity'
import { ChatEntity } from '../../model/chat/chat.entity'
import { OrganizationEntity } from '../../model/organization/organization.entity'
import {
  ErrorCode,
  errorMessage,
  HttpException,
} from '../../middleware/exceptions'
import { CardEntity } from 'src/model/scrumboard'

const storage = new Storage({
  projectId: process.env.PROJECT_ID,
  credentials: {
    private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.CLIENT_EMAIL,
  },
})

const BUCKET_NAME = process.env.BUCKET

if (!BUCKET_NAME) {
  errorMessage('SERVICE', 'gcs', 'missing google env(bucket name)')
  throw new HttpException(500, ErrorCode[500])
}

const getFileExt = async (mediaObj: any) => {
  switch (mediaObj.contentType) {
    case 'image/jpg':
    case 'image/jpeg':
      return '.jpg'
    case 'image/png':
      return '.png'
    case 'image/gif':
      return '.gif'
    case 'video/mp4':
      return '.mp4'
    default:
      return ''
  }
}

const upload = async (filename: string, content: string | Buffer) => {
  try {
    storage
      .bucket(BUCKET_NAME)
      .file(filename)
      .save(content, (error: any) => {
        if (!error) {
          storage.bucket(BUCKET_NAME).file(filename).makePublic()
        } else {
          errorMessage('SERVICE', 'gcs', 'Upload file to Google storage', error)
          throw new HttpException(400, ErrorCode[400])
        }
      })
    return await storage.bucket(BUCKET_NAME).file(filename).exists()
  } catch (error) {
    console.error('Upload file to Google storage ', error)
    throw new HttpException(400, ErrorCode[400])
  }
}

export const uploadChatMessageFromFileURL = async (
  organizationId: string,
  channel: ChannelEntity,
  customerId: string,
  filename: string,
  url: string,
) => {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
  })
  const mediaObj = {
    contentType: response.headers['content-type'],
    data: response.data,
  }
  const fileExt = await getFileExt(mediaObj)
  await upload(
    `${organizationId}/chat/${channel.id}/message/${customerId}/${filename}${fileExt}`,
    mediaObj.data,
  )
  return `${filename}${fileExt}`
}
export const uploadCardAttachmentFromFileObject = async (
  organizationId: string,
  cardId: string,
  filename: string,
  mediaObj: any,
) => {
  const fileExt = await getFileExt(mediaObj)
  upload(
    `${organizationId}/card/${cardId}/${filename}${fileExt}`,
    mediaObj.data,
  )
  return `${filename}${fileExt}`
}
export const uploadChatMessageFromFileObject = async (
  organizationId: string,
  channel: ChannelEntity,
  customerId: string,
  filename: string,
  mediaObj: any,
) => {
  const fileExt = await getFileExt(mediaObj)
  upload(
    `${organizationId}/chat/${channel.id}/message/${customerId}/${filename}${fileExt}`,
    mediaObj.data,
  )
  return `${filename}${fileExt}`
}
export const uploadChatCustomerDisplay = async (
  channel: ChannelEntity,
  uid: string,
  filename: string,
  url: string,
) => {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
  })
  const mediaObj = {
    contentType: response.headers['content-type'],
    data: response.data,
  }
  const fileExt = await getFileExt(mediaObj)
  await upload(
    `${channel.organization.id}/chat/${channel.id}/display/${uid}/${filename}${fileExt}`,
    mediaObj.data,
  )
  return `${filename}${fileExt}`
}
export const uploadImageReplyTemplate = async (
  reply: ReplyEntity,
  filename: string,
  mediaObj: any,
) => {
  const fileExt = await getFileExt(mediaObj)
  const newFilename = Date.now() + '_' + filename
  await upload(
    `${reply.organization.id}/reply/${reply.id}/${newFilename}${fileExt}`,
    mediaObj.data,
  )
  return `${newFilename}${fileExt}`
}
export const uploadTeamChatMessageFromFileObject = async (
  organizationId: string,
  chat: ChatEntity,
  filename: string,
  mediaObj: any,
) => {
  const fileExt = await getFileExt(mediaObj)
  await upload(
    `${organizationId}/teamChat/${chat.id}/${filename}${fileExt}`,
    mediaObj.data,
  )
  return `${filename}${fileExt}`
}

const STORAGE_URL = 'https://storage.googleapis.com'
export const getChatMessageContentURL = (
  organizationId: string,
  channelId: string,
  customerId: string,
  filename: string,
) => {
  return `${STORAGE_URL}/${BUCKET_NAME}/${organizationId}/chat/${channelId}/message/${customerId}/${filename}`
}
export const getCardAttachmentContentURL =  (
  organizationId: string,
  cardId: string,
  filename: string,
) => {
  return `${STORAGE_URL}/${BUCKET_NAME}/${organizationId}/card/${cardId}/${filename}`
}
export const getCustomerDisplayURL = (
  organizationId: string,
  channelId: string,
  uid: string,
  filename: string,
) => {
  return `${STORAGE_URL}/${BUCKET_NAME}/${organizationId}/chat/${channelId}/display/${uid}/${filename}`
}
export const getReplyContentURL = (reply: ReplyEntity, filename: string) => {
  return `${STORAGE_URL}/${BUCKET_NAME}/${reply.organization.id}/reply/${reply.id}/${filename}`
}
export const getTeamChatMessageContentURL = (
  organizationId: string,
  chat: ChatEntity,
  filename: string,
) => {
  return `${STORAGE_URL}/${BUCKET_NAME}/${organizationId}/teamChat/${chat.id}/${filename}`
}

export const copyReplyResponseContentToMessage = async (
  organizationId: string,
  channelId: string,
  customerId: string,
  replyId: string,
  filename: string,
) => {
  try {
    storage
      .bucket(`${BUCKET_NAME}`)
      .file(`${organizationId}/reply/${replyId}/${filename}`)
      .copy(
        `${organizationId}/chat/${channelId}/message/${customerId}/${filename}`,
        (err: any) => {
          if (!err) {
            storage
              .bucket(`${BUCKET_NAME}`)
              .file(
                `${organizationId}/chat/${channelId}/message/${customerId}/${filename}`,
              )
              .makePublic()
          } else {
            console.error('Copy file to Google storage ', err)
            throw new HttpException(400, ErrorCode[400])
          }
        },
      )
    await storage
      .bucket(`${BUCKET_NAME}`)
      .file(
        `${organizationId}/chat/${channelId}/message/${customerId}/${filename}`,
      )
      .exists()
  } catch (error) {
    console.error('Copy file to Google storage ', error)
    throw new HttpException(400, ErrorCode[400])
  }
}
