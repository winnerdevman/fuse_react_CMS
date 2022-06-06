import { Router } from 'express'
import { teamController } from '../../controller/user'

const router = Router()

router.get('/', teamController.getTeam)
router.get('/list', teamController.getTeams)
router.post('/', teamController.createTeam)
router.put('/', teamController.updateTeam)
router.delete('/', teamController.deleteTeam)

export default {
  router,
}
