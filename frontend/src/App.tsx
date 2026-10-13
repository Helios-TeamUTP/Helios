import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { RecuperarPassword } from './pages/RecuperarPassword'
import { RestablecerPassword } from './pages/RestablecerPassword'
import { AgendarCita } from './pages/AgendarCita'
import { MisCitas } from './pages/MisCitas'
import { MedicoDashboardV2 } from './pages/MedicoDashboardV2'
import { PacientesMedico } from './pages/PacientesMedico'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="registro" element={<Register />} />
            <Route path="recuperar-password" element={<RecuperarPassword />} />
            <Route path="restablecer-password" element={<RestablecerPassword />} />
            {/* Rutas de paciente */}
            <Route element={<ProtectedRoute requireRole="paciente" />}>
              <Route path="agendar" element={<AgendarCita />} />
              <Route path="mis-citas" element={<MisCitas />} />
            </Route>
            {/* Rutas de médico */}
            <Route element={<ProtectedRoute requireRole="medico" />}>
              <Route path="medico" element={<MedicoDashboardV2 />} />
              <Route path="medico/pacientes" element={<PacientesMedico />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
