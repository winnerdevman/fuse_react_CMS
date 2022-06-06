import path from 'path'
import { config } from 'dotenv'
config({ path: path.join(__dirname, './env/.env') })

import express, { Application, Request, Response } from 'express'
import * as bodyParser from 'body-parser'
import api from './api'
import cors from 'cors'

import {
  Connection,
  createConnection,
  getConnectionManager,
  QueryFailedError,
} from 'typeorm'
import helmet from 'helmet'
import multer from 'multer'

// import connection from './connection'
import { errorMessage } from './middleware/exceptions'

createConnection().then(async (connection: Connection) => {

  const PORT = process.env.PORT || 5000
  const app: Application = express()

  const WHITELIST = process.env.WHITELIST
  let allowedOrigins: string | any[] = []
  if (WHITELIST) {
    allowedOrigins = WHITELIST.split(',')
  }

  const multerMid = multer({
    storage: multer.memoryStorage(),
    limits: {
      // no larger than 5mb.
      fileSize: 25 * 1024 * 1024,
    },
  })

  app.use(
    cors({
      origin: (origin, callback) => {
        // allow requests with no origin
        // (like mobile apps or curl requests)
        if (!origin) return callback(null, true)
        if (allowedOrigins.indexOf(origin) === -1) {
          const msg =
            'The CORS policy for this site does not ' +
            'allow access from the specified Origin.'
          return callback(new Error(msg), false)
        }
        return callback(null, true)
      },
    }),
  )
  app.use(
    cors({
      origin: '*',
    }),
  )

  app.use(helmet())

  //     // parse requests of content-type - application/json
  app.use(multerMid.single('file'))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  app.get('/', (req: Request, res: Response) => {
    res.send('' + new Date())
  })
  app.use('/api', api.router)

  app.listen(PORT, () => {
    // tslint:disable-next-line:no-console
    console.log('Fox Service listening on port', PORT)
  })

}).catch((error: QueryFailedError) => {
  errorMessage('DATABASE', 'app', error.message)
})

// createConnection()
//   .then(async (connection: Connection) => {

//   })
//   .catch((error: any) => console.error('TypeORM connection error: ', error))

// export default app
