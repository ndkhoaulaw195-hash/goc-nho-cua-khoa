import { createRoot } from 'react-dom/client'
import './index.css'
import { Experience } from './scene/Experience'
import { Overlay } from './ui/Overlay'
import { useStore } from './store'

;(window as unknown as { __store: typeof useStore }).__store = useStore

createRoot(document.getElementById('root')!).render(
  <main className="app">
    <Experience />
    <Overlay />
  </main>,
)
