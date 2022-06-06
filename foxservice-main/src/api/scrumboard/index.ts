import { Router } from 'express'
import scrumboardAPI from './scrumboard'

// Scrumboard Router
const scrumboardRouter = Router()
scrumboardRouter.use('/', scrumboardAPI.router)

export default {
  scrumboardRouter,
}
