import { Link, useNavigate } from 'react-router-dom'
import { Home, LogIn, LogOut, LayoutDashboard, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary-600 text-white font-bold text-lg px-3 py-1 rounded-lg">PIB</div>
            <span className="hidden sm:block text-gray-700 font-medium text-sm">Portal Inmobiliario Bahiense</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1 text-gray-600 hover:text-primary-600 transition-colors text-sm font-medium">
              <Home size={16} /> Inicio
            </Link>
            <Link to="/propiedades" className="text-gray-600 hover:text-primary-600 transition-colors text-sm font-medium">
              Propiedades
            </Link>
            <Link to="/alquileres" className="text-gray-600 hover:text-primary-600 transition-colors text-sm font-medium">
              Alquileres
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard" className="flex items-center gap-1 text-gray-600 hover:text-primary-600 transition-colors text-sm font-medium">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1 btn-secondary text-sm py-1.5">
                  <LogOut size={16} /> Salir
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-1.5 flex items-center gap-1">
                  <LogIn size={16} /> Ingresar
                </Link>
                <Link to="/registro" className="btn-primary text-sm py-1.5">
                  Publicar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 flex flex-col gap-3">
            <Link to="/" className="text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>Inicio</Link>
            <Link to="/propiedades" className="text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>Propiedades</Link>
            <Link to="/alquileres" className="text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>Alquileres</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <button onClick={handleLogout} className="text-left text-red-600 font-medium">Cerrar sesión</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>Ingresar</Link>
                <Link to="/registro" className="btn-primary text-center" onClick={() => setMenuOpen(false)}>Publicar</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
