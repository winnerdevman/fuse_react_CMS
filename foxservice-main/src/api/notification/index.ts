import { Router } from 'express'
import notificationAPI from './notification'

// Notification Router
const notificationRouter = Router()
notificationRouter.use('/', notificationAPI.router)

// User no Organization Router
const notificationNoOrganizationRouter = Router()
notificationNoOrganizationRouter.use('/', notificationAPI.routerWithoutOrganization)

export default {
  notificationRouter,
  notificationNoOrganizationRouter,
}
