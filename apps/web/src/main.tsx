import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { AppProvider } from './features/core/app-context'
import { createAppRepository } from './lib/repository'
import './index.css'

const repository = createAppRepository()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider repository={repository}>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>
)
