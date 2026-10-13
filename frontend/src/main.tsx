import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Debe ir ANTES de App (y de lib/supabase): captura el enlace de recuperación de
// contraseña antes de que el SDK de Supabase consuma y limpie el hash de la URL.
import './lib/recuperacionPassword'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
