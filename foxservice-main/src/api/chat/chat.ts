import { Router } from 'express'
import {
  chatController,
  messageController,
  teamChatController,
} from '../../controller/chat'

const router = Router()

// api for get All chat list
router.get('/', chatController.getChat)
router.get('/list', chatController.getChats)
router.get('/history', chatController.getChatHistory)
router.get('/history/list', chatController.getChatHistories)
router.put('/', chatController.updateChat)
router.put('/owner', chatController.updateChatOwner)
router.delete('/', chatController.deleteChat)

router.post('/sendMessage', messageController.sendMessage)
router.post('/uploads/:channelId/:uid', messageController.uploadContent)

router.post('/sendReplyMessage', messageController.sendReplyMessage)

// router
export default {
  router,
}
