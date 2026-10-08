import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AccessProvider } from '@/context/AccessContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <AccessProvider>
        <App />
      </AccessProvider>
    </HashRouter>
  </StrictMode>,
)
