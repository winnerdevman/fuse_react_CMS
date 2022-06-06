import { Router } from 'express'
import { teamChatController } from '../../controller/chat'

const router = Router()

router
  .post('/sendMessage', teamChatController.sendMessage)
  .put('/read', teamChatController.markReaMentions)
  .post('/uploads/:chatId', teamChatController.uploadContent)

export default {
  router,
}
