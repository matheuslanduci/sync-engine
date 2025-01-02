import App from './App.tsx'

import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'

const rootElement = document.getElementById('root')

if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>
)
