import { Router } from 'express'
import { replyController, responseController } from '../../controller/reply'

const router = Router()

router
  .get('/', replyController.getReply)
  .get('/list', replyController.getReplies)
  .get('/list/:type', replyController.getRepliesWithType)
  .post('/', replyController.createReply)
  .put('/', replyController.updateReply)
  .delete('/', replyController.deleteReply)

export default {
  router,
}
