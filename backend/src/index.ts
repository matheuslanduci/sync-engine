import { db, type Todo } from './db.js'

import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { cors } from 'hono/cors'
import type { WSContext } from 'hono/ws'
import { Hono } from 'hono'

const app = new Hono()

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

app.use(cors())

app.get('/', (c) => {
	return c.text('Hello Hono!')
})

app.post('/sync', async (c) => {
	const body = await c.req.json()

	const items = body.items as Todo[]

	for (const item of items) {
		if (db.todos.read(item.id)) db.todos.update(item.id, item)
		else db.todos.create(item)
	}

	const todos = db.todos.list()

	const missingItems = todos.filter(
		(todo) => !items.find((item) => item.id === todo.id)
	)

	return c.json({ items: missingItems })
})

const clients = new Map<string, WSContext>()

app.get(
	'/ws',
	upgradeWebSocket((c) => ({
		onOpen: (evt, ws) => {
			const clientId = c.req.query('clientId') ?? 'unknown'
			clients.set(clientId, ws)
			console.log(`Client connected: ${clientId}`)
		},
		onClose: (evt, ws) => {
			const clientId = c.req.query('clientId') ?? 'unknown'
			clients.delete(clientId)
			console.log(`Client disconnected: ${clientId}`)
		},
		onMessage: (evt, ws) => {
			const clientId = c.req.query('clientId') ?? 'unknown'
			const message = JSON.parse(evt.data.toString())

			switch (message.event) {
				case 'item:put': {
					const todo = message.todo

					if (db.todos.read(todo.id)) db.todos.update(todo.id, todo)
					else db.todos.create(todo)

					for (const [, client] of clients) {
						client.send(
							JSON.stringify({
								event: 'item:put',
								todo
							})
						)
					}

					console.log(`Client ${clientId} put todo: ${todo.id}`)
					break
				}
				case 'item:delete': {
					const todo = message.todo

					if (db.todos.read(todo.id)) db.todos.delete(todo.id)

					for (const [, client] of clients) {
						client.send(
							JSON.stringify({
								event: 'item:delete',
								todo
							})
						)
					}

					console.log(`Client ${clientId} delete todo: ${todo.id}`)
					break
				}
				default: {
					console.log(`Client ${clientId} sent unknown event: ${message.event}`)
					break
				}
			}
		}
	}))
)

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

const server = serve({
	fetch: app.fetch,
	port
})

injectWebSocket(server)
