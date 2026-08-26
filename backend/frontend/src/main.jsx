import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.jsx'
import './index.css'

// =====================================================
// NAVTA APPLICATION ENTRY POINT
// =====================================================

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error(
    'Root element was not found. Make sure index.html contains <div id="root"></div>.'
  )
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
