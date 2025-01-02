import { nanoid } from 'nanoid'
import { useState } from 'react'

type Todo = {
	id: string
	content: string
	done: boolean
	version: number
	clientId: string
	createdAt: Date
}

const clientId = nanoid()

function App() {
	const [todos, setTodos] = useState<Todo[]>([])

	const addTodo = (content: string) => {
		const todo = {
			id: nanoid(),
			content,
			done: false,
			createdAt: new Date(),
			version: todos.length,
			clientId
		}

		setTodos([...todos, todo])
	}

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		const formData = new FormData(e.target as HTMLFormElement)

		const content = formData.get('content') as string

		addTodo(content)

		e.currentTarget.reset()
	}

	return (
		<>
			<form onSubmit={onSubmit}>
				<input type="text" name="content" />
				<button type="submit">Add</button>
			</form>

			<ul>
				{todos.map((todo) => (
					<li key={todo.id}>
						<input type="checkbox" checked={todo.done} />
						{todo.content}
					</li>
				))}
			</ul>
		</>
	)
}

export default App
