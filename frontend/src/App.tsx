import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/ui/Navbar'
import { ProtectedRoute } from './components/ui/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { PublishPropertyPage } from './pages/PublishPropertyPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Marketplace general */}
              <Route path="/" element={<HomePage />} />

              {/* Sección ventas */}
              <Route path="/propiedades" element={<HomePage />} />

              {/* Sección alquileres - misma interfaz, filtro por RENT */}
              <Route path="/alquileres" element={<HomePage defaultOperationType="RENT" />} />

              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />

              {/* Rutas protegidas - Inmobiliarias y Particulares */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={['AGENCY', 'PARTICULAR']}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/publicar"
                element={
                  <ProtectedRoute roles={['AGENCY', 'PARTICULAR']}>
                    <PublishPropertyPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} PIB - Portal Inmobiliario Bahiense · Bahía Blanca, Argentina
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
