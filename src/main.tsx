import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { SettingsProvider } from './lib/settings'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </HashRouter>
  </React.StrictMode>
)

// PWA service worker
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}

// Mobile keyboards: when a field gains focus, scroll it into the visible area
// so neither the keyboard nor the bottom nav ever covers what you're typing.
if (window.matchMedia('(pointer: coarse)').matches) {
  document.addEventListener('focusin', (e) => {
    const t = e.target as HTMLElement
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) {
      setTimeout(() => t.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
    }
  })
}

// Touch devices: suppress the browser context menu (long-press) so navigation
// feels native. Desktop right-click keeps working normally.
if (window.matchMedia('(pointer: coarse)').matches) {
  window.addEventListener('contextmenu', (e) => {
    const t = e.target as HTMLElement
    // allow the menu inside editable areas (copy/paste in the editor and inputs)
    if (t.closest('.ProseMirror, input, textarea')) return
    e.preventDefault()
  })
}
