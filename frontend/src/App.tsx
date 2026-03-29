import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/ui/Navbar'
import { ProtectedRoute } from './components/ui/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { PublishPropertyPage } from './pages/PublishPropertyPage'
import { PropertyDetailPage } from './pages/PropertyDetailPage'
import { EditPropertyPage } from './pages/EditPropertyPage'
import { AdminPage } from './pages/AdminPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SuspendedPage } from './pages/SuspendedPage'
import { useAuth } from './context/AuthContext'

const SuspendedGuard = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  if (user?.isSuspended) return <Navigate to="/suspendida" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Marketplace */}
              <Route path="/" element={<HomePage />} />
              <Route path="/propiedades" element={<HomePage />} />
              <Route path="/alquileres" element={<HomePage defaultOperationType="RENT" />} />
              <Route path="/propiedad/:id" element={<PropertyDetailPage />} />

              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/recuperar-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Inmobiliarias y Particulares */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={['AGENCY', 'PARTICULAR']}>
                    <SuspendedGuard>
                      <DashboardPage />
                    </SuspendedGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/publicar"
                element={
                  <ProtectedRoute roles={['AGENCY', 'PARTICULAR']}>
                    <SuspendedGuard>
                      <PublishPropertyPage />
                    </SuspendedGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editar/:id"
                element={
                  <ProtectedRoute roles={['AGENCY', 'PARTICULAR']}>
                    <SuspendedGuard>
                      <EditPropertyPage />
                    </SuspendedGuard>
                  </ProtectedRoute>
                }
              />

              {/* Suspendida */}
              <Route path="/suspendida" element={<SuspendedPage />} />

              {/* Admin */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
                  <p className="text-6xl font-bold mb-4">404</p>
                  <p className="text-lg">Página no encontrada</p>
                </div>
              } />
            </Routes>
          </main>
          <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} PIB — Portal Inmobiliario Bahiense · Bahía Blanca, Argentina
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
