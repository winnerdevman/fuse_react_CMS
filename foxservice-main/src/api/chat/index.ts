import { Router } from 'express'
import chatAPI from './chat'
import teamChatAPI from './teamChat'

// Chat Router
const chatRouter = Router()
chatRouter.use('/', chatAPI.router)

// TeamChat Router
const teamChatRouter = Router()
teamChatRouter.use('/', teamChatAPI.router)

export default {
  chatRouter,
  teamChatRouter,
}
