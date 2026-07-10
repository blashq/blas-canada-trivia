import React from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import Join from './views/Join.jsx'
import Present from './views/Present.jsx'
import Host from './views/Host.jsx'

function App() {
  const h = window.location.hash.replace(/^#\/?/, '')
  if (h === 'present') return <Present />
  if (h === 'host') return <Host />
  return <Join />
}

createRoot(document.getElementById('root')).render(<App />)
