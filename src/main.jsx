import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import MentionInput from './App.jsx'
import WYSIWYGEditor from './WYSIWYGEditor.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WYSIWYGEditor />
  </StrictMode>,
)
