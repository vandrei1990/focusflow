import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Apply dark mode from localStorage before render to avoid flash
const stored = localStorage.getItem('focusflow-store')
if (stored) {
  try {
    const parsed = JSON.parse(stored)
    const darkMode = parsed?.state?.settings?.darkMode ?? true
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  } catch {
    document.documentElement.classList.add('dark')
  }
} else {
  document.documentElement.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
