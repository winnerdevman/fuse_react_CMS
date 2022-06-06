import { Router } from 'express'
import { channelController } from '../../controller/channel'

const router = Router()

router.get('/', channelController.getChannel)
router.get('/list', channelController.getChannels)
router.post('/', channelController.createChannel)
router.put('/', channelController.updateChannel)
router.delete('/', channelController.deleteChannel)

router.get('/exchangeToken', channelController.exchangeAccessToken)

// router
export default {
  router,
}
