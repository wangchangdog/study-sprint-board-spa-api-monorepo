import { createApp } from './app'
import { env } from './lib/env'
import { prisma } from './lib/prisma'
import { createPrismaBoardStore } from './services/prisma-board-store'

const app = createApp({
  store: createPrismaBoardStore(prisma),
  cookieName: env.SESSION_COOKIE_NAME,
  allowedOrigin: env.APP_WEB_URL,
})
const port = env.API_PORT

app.listen(port, () => {
  console.log(`Study Sprint Board API listening on http://localhost:${port}`)
})
