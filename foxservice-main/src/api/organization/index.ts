import { Router } from 'express'
import activationAPI from './activation'
import organizationAPI from './organization'
import packageAPI from './package'

// Organization Router
const activationRouter = Router()
activationRouter.use('/', activationAPI.router)

// Organization Router
const organizationRouter = Router()
organizationRouter.use('/', organizationAPI.router)

// Package Router
const packageRouter = Router()
packageRouter.use('/', packageAPI.router)

export default {
  activationRouter,
  organizationRouter,
  packageRouter,
}
