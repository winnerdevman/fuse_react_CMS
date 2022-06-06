import cors from 'cors'
import { Router } from 'express'
import { packageController } from '../../controller/organization'

const router = Router()

router.get('/', packageController.getPackage)
router.get('/list', packageController.getPackages)

export default {
  router,
}
