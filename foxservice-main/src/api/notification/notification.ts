import cors from 'cors'
import { Router } from 'express'
import { notificationController } from '../../controller/notification'

const routerWithoutOrganization = Router()
routerWithoutOrganization.put('/setting', notificationController.updateNotificationSetting)
routerWithoutOrganization.get('/', notificationController.getNotifications)
routerWithoutOrganization.put('/read', notificationController.markReadNotification)
routerWithoutOrganization.put('/readAll', notificationController.markReadNotifications)



const router = Router()

router.get('/', notificationController.getNotifications)
router.put('/read', notificationController.markReadNotification)
router.put('/readAll', notificationController.markReadNotifications)
export default {
  router,
  routerWithoutOrganization,
}
