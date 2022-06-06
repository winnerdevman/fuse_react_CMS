import { Router } from 'express'
import { userController } from '../../controller/user'

const routerWithoutOrganization = Router()
routerWithoutOrganization.get('/', userController.getUser)
// routerWithoutOrganization.post('/', userController.createUser)
routerWithoutOrganization.put('/', userController.updateUser)

const router = Router()

router.get('/', userController.getUser)
router.get('/list', userController.getUsers)
// router.post('/', userController.createUser)
router.put('/', userController.updateUser)
router.delete('/', userController.deleteUser)

// Relation between Organization and User
router.post('/organization', userController.addUserToOrganization)
router.delete('/organization', userController.removeUserFromOrganization)

export default {
  router,
  routerWithoutOrganization,
}
