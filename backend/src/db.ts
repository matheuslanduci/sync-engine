type Todo = {
	id: string
	content: string
	done: boolean
	version: number
	clientId: string
	createdAt: Date
}

const todos: Todo[] = []

export const db = {
	todos: {
		list: () => {
			return todos
		},
		listAfter: (version: number) => {
			return todos.filter((todo) => todo.version > version)
		},
		create: (todo: Todo) => {
			todos.push(todo)
		},
		update: (id: string, todo: Todo) => {
			const index = todos.findIndex((todo) => todo.id === id)
			todos[index] = todo
		},
		delete: (id: string) => {
			const index = todos.findIndex((todo) => todo.id === id)
			todos.splice(index, 1)
		}
	}
}
