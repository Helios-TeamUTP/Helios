import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { AgendarCita } from './pages/AgendarCita'
import { MisCitas } from './pages/MisCitas'
import { MedicoDashboard } from './pages/MedicoDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="registro" element={<Register />} />
            {/* Rutas de paciente */}
            <Route element={<ProtectedRoute requireRole="paciente" />}>
              <Route path="agendar" element={<AgendarCita />} />
              <Route path="mis-citas" element={<MisCitas />} />
            </Route>
            {/* Bug B-13: ruta protegida del dashboard medico */}
            <Route element={<ProtectedRoute requireRole="medico" />}>
              <Route path="medico" element={<MedicoDashboard />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
