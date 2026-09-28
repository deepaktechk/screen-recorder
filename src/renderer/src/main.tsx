import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { FloatingWidget } from './features/recorder/components/floating-widget'

const isWidgetView = window.location.hash.includes('widget')

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {isWidgetView ? <FloatingWidget /> : <App />}
    </StrictMode>
)

