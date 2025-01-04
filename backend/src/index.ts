import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { cors } from 'hono/cors'
import { Hono } from 'hono'

const app = new Hono()

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

app.use(cors())

app.get('/', (c) => {
	return c.text('Hello Hono!')
})

app.get(
	'/ws',
	upgradeWebSocket((c) => ({
		onOpen: (evt, ws) => {},
		onClose: (evt, ws) => {},
		onMessage: (evt, ws) => {}
	}))
)

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

const server = serve({
	fetch: app.fetch,
	port
})

injectWebSocket(server)
