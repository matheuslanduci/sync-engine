import Dexie, { type EntityTable } from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import { nanoid } from 'nanoid'
import { useEffect } from 'react'

type Todo = {
	id: string
	content: string
	done: boolean
	version: number
	clientId: string
	createdAt: Date
}

const clientId = nanoid()

const db = new Dexie('todos') as Dexie & {
	todos: EntityTable<Todo, 'id'>
}

db.version(1).stores({
	todos: 'id, clientId, version'
})

const ws = new WebSocket(`ws://localhost:3000/ws?clientId=${clientId}`)

ws.addEventListener('open', () => {
	console.log('Connected to server')

	window.addEventListener('item:put', (e) => {
		const todo = (e as CustomEvent<{ todo: Todo }>).detail.todo

		ws.send(
			JSON.stringify({
				event: 'item:put',
				todo
			})
		)
	})

	window.addEventListener('item:delete', (e) => {
		const todo = (e as CustomEvent<{ todo: Todo }>).detail.todo

		ws.send(
			JSON.stringify({
				event: 'item:delete',
				todo
			})
		)
	})

	ws.addEventListener('message', async (e) => {
		const message = JSON.parse(e.data)

		switch (message.event) {
			case 'item:put': {
				const todo = message.todo

				if (await db.todos.get(todo.id)) db.todos.put(todo)
				else db.todos.add(todo)

				console.log(`Server put todo: ${todo.id}`)
				break
			}
			case 'item:delete': {
				const todo = message.todo

				if (await db.todos.get(todo.id)) db.todos.delete(todo.id)

				console.log(`Server delete todo: ${todo.id}`)
				break
			}
			default: {
				console.log(`Server sent unknown event: ${message.event}`)
				break
			}
		}
	})
})

function App() {
	const todos = useLiveQuery(() => db.todos.toCollection().sortBy('createdAt'))

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		const formData = new FormData(e.target as HTMLFormElement)

		const content = formData.get('content') as string

		const todo: Todo = {
			id: nanoid(),
			content,
			done: false,
			createdAt: new Date(),
			version: todos?.length ?? 1,
			clientId
		}

		e.currentTarget.reset()

		await db.todos.add(todo).then(() => {
			window.dispatchEvent(
				new CustomEvent('item:put', {
					detail: { todo }
				})
			)
		})
	}

	useEffect(() => {
		async function sync() {
			const response = await fetch('http://localhost:3000/sync', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					items: await db.todos.toArray()
				})
			})

			const { items } = await response.json()

			for (const todo of items) {
				if (await db.todos.get(todo.id)) db.todos.put(todo)
				else db.todos.add(todo)
			}
		}

		sync()
	}, [])

	return (
		<>
			<form onSubmit={onSubmit}>
				<input type="text" name="content" />
				<button type="submit">Add</button>
			</form>

			<ul>
				{todos?.map((todo) => (
					<li key={todo.id}>
						<input
							type="checkbox"
							checked={todo.done}
							onChange={async (e) => {
								await db.todos.update(todo.id, { done: e.target.checked })

								window.dispatchEvent(
									new CustomEvent('item:put', {
										detail: { todo }
									})
								)
							}}
						/>
						{todo.content}

						<button
							type="button"
							onClick={async () => {
								await db.todos.delete(todo.id)

								window.dispatchEvent(
									new CustomEvent('item:delete', {
										detail: { todo }
									})
								)
							}}
						>
							Delete
						</button>
					</li>
				))}
			</ul>
		</>
	)
}

export default App
