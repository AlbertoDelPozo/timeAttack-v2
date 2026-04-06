import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { NextUIProvider } from '@nextui-org/react'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NextUIProvider>
      <div className="dark text-foreground bg-background">
        <App />
      </div>
    </NextUIProvider>
  </StrictMode>,
)