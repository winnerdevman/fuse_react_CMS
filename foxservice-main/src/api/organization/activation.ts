import cors from 'cors'
import { Router } from 'express'
import { activationController } from '../../controller/organization'

const router = Router()

router.get('/', activationController.getActivation)
// router.get('/list', activationController.getActivations)

export default {
  router,
}
