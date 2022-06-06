import cors from 'cors'
import { Router } from 'express'
import { organizationController } from '../../controller/organization'
import { getOrganization } from '../../controller/organization/organization'

const router = Router()

router.get('/', organizationController.getOrganization)
router.get('/list', organizationController.getOrganizations)
router.post('/', organizationController.createOrganization)
router.put('/', organizationController.updateOrganization)
router.delete('/', organizationController.deleteOrganization)

export default {
  router,
}
