import { NextFunction, Request, Response, Router } from 'express'
import {
  log,
  logErrors,
  routeDefaultNotFound,
  routeError,
} from '../middleware/exceptions'
import {
  verifyGoogleToken,
  verifyOrganization,
} from '../middleware/authenticate'

import { getConnection } from 'typeorm'

import channel from './channel'
import chat from './chat'
import customer from './customer'
import dashboard from './dashboard'
// import * as eCommerce from './eCommerce'
import notification from './notification'
import organization from './organization'
import reply from './reply'
import user from './user'
import todos from './todos'
import scrumboard from './scrumboard'
import webhook from './webhook'
import eCommerce from './eCommerce'
import sse from './sse'

const router = Router()

// Log
router.use(log)

router.get('/status', (req: Request, res: Response, next: NextFunction) => {
  res.json({
    API_Version: process.env.VERSION,
    Database: getConnection().isConnected,
  })
})

// Webhook
router.use('/webhook/', webhook.webhookRouter)

// Server-Sent Events
router.use('/sse/', sse.sseRouter)

router.use('/', verifyGoogleToken)

router.use('/activation', organization.activationRouter)
router.use('/organization', organization.organizationRouter)
router.use('/package', organization.packageRouter)
router.use('/user', user.userNoOrganizationRouter)
router.use('/notification', notification.notificationNoOrganizationRouter)

router.use('/:organizationId/', verifyOrganization)
router.use('/:organizationId/user', user.userRouter)
router.use('/:organizationId/team', user.teamRouter)

// router.use('/:organizationId/sse/', verifyToken, sse.router)

// Channel
router.use('/:organizationId/channel', channel.channelRouter)

// Chat
router.use('/:organizationId/chat', chat.chatRouter)
// router.use('/:organizationId/chat/message', verifyToken, chat.message.router)
// router.use('/:organizationId/chat/reply/', verifyToken, chat.reply.router)

// Customer
router.use('/:organizationId/customer', customer.customerRouter)
router.use('/:organizationId/customer/address', customer.addressRouter)
router.use('/:organizationId/customer/label', customer.labelRouter)
router.use('/:organizationId/customer/pointHistory', customer.pointLogRouter)
router.use('/:organizationId/customer/reward', customer.rewardRouter)
router.use('/:organizationId/customer/rewardHistory', customer.rewardLogRouter)

// Notification
router.use('/:organizationId/notification', notification.notificationRouter)

// Reply
router.use('/:organizationId/reply', reply.replyRouter)
router.use('/:organizationId/reply/keyword', reply.keywordRouter)
router.use('/:organizationId/reply/response', reply.responseRouter)

// TeamChat
router.use('/:organizationId/teamChat', chat.teamChatRouter)

// Todos
router.use('/:organizationId/todo', todos.todosRouter)
router.use('/:organizationId/todo/label', todos.labelRouter)

// Scrumboard
router.use('/:organizationId/scrumboard', scrumboard.scrumboardRouter)
// router.use('/:organizationId/todo/label', scrumboard.labelRouter)

// eCommerce
router.use('/:organizationId/eCommerce', eCommerce.ECommerceRouter)

// Dashboard
router.use('/:organizationId/dashboard', dashboard.dashboardRouter)

// // Category and Product
// router.use('/:organizationId/category', verifyToken, product.category.router)
// router.use('/:organizationId/product', verifyToken, product.product.router)

// router.use(
//   '/:organizationId/eCommerce/products',
//   verifyToken,
//   eCommerce.product.router,
// )
// router.use(
//   '/:organizationId/eCommerce/orders',
//   verifyToken,
//   eCommerce.order.router,
// )
// router.use(
//   '/:organizationId/eCommerce/categories',
//   verifyToken,
//   eCommerce.category.router,
// )

// // Chat Service
// router.use('/:organizationId/chat/address', verifyToken, chat.address.router)
// router.use('/:organizationId/chat/channel', verifyToken, chat.channel.router)
// router.use('/:organizationId/chat/chat', verifyToken, chat.chat.router)
// router.use('/:organizationId/chat/customer', verifyToken, chat.customer.router)
// router.use('/:organizationId/chat/event', verifyToken, chat.event.router)
// router.use('/:organizationId/chat/message', verifyToken, chat.message.router)
// router.use('/:organizationId/chat/reply/', verifyToken, chat.reply.router)

// router.use('/:organizationId/live/comment/', verifyToken, live.router)

// // Team Chat
// router.use('/:organizationId/chat/teamChat/', verifyToken, chat.teamChat.router)

// // Mention
// router.use('/:organizationId/chat/mention/', verifyToken, chat.mention.router)

// // Reply
// router.use('/:organizationId/reply/', verifyToken, reply.router)

// // Customer Label
// router.use(
//   '/:organizationId/chat/customerLabel',
//   verifyToken,
//   chat.customerLabel.router,
// )

// // Customer
// router.use('/:organizationId/customer', verifyToken, customer.customer.router)
// router.use(
//   '/:organizationId/customer/address',
//   verifyToken,
//   customer.address.router,
// )
// router.use(
//   '/:organizationId/customer/label',
//   verifyToken,
//   customer.label.router,
// )
// router.use('/:organizationId/point/log', verifyToken, customer.pointLog.router)
// router.use('/:organizationId/reward', verifyToken, customer.reward.router)
// router.use(
//   '/:organizationId/reward/log',
//   verifyToken,
//   customer.rewardLog.router,
// )

// // Notification
// router.use(
//   '/:organizationId/notification/',
//   verifyToken,
//   notification.notification.router,
// )

// // SSE
// router.use('/:organizationId/sse/', chat.sse.router)
// router.use('/:organizationId/sse/', verifyToken, sse.router)

// Log Error
router.use(logErrors)
// Response default 404 Not Found
router.use(routeDefaultNotFound)

// Response Error Handle
router.use(routeError)

export default {
  router,
}
