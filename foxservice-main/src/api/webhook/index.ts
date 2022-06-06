import { Router } from 'express'
import lineAPI from './line'
import facebookAPI from './facebook'
import woocommerceAPI from './woocommerce'

// Webhook Router
const webhookRouter = Router()
webhookRouter.use('/line', lineAPI.router)
webhookRouter.use('/facebook', facebookAPI.router)
webhookRouter.use('/woocommerce', woocommerceAPI.router)

export default {
  webhookRouter,
}
