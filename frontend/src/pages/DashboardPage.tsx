import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Building2, Eye, Pencil, Trash2, Clock, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Property } from '../types'
import { getMyPropertiesService, deletePropertyService } from '../services/property.service'

const STATUS_CONFIG = {
  ACTIVE: { label: 'Activa', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  PAUSED: { label: 'Pausada', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  SOLD: { label: 'Vendida', icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
  RENTED: { label: 'Alquilada', icon: CheckCircle, color: 'text-purple-600 bg-purple-50' },
}

export const DashboardPage = () => {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getMyPropertiesService()
      .then(setProperties)
      .finally(() => setIsLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta propiedad?')) return
    await deletePropertyService(id)
    setProperties(prev => prev.filter(p => p.id !== id))
  }

  if (!user?.isVerified) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Clock size={56} className="mx-auto mb-4 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cuenta pendiente de verificación</h2>
        <p className="text-gray-500">
          Tu documentación está siendo revisada. Te notificaremos por email cuando tu cuenta sea aprobada y puedas comenzar a publicar.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis propiedades</h1>
          <p className="text-gray-500 text-sm mt-1">Hola, {user.name}</p>
        </div>
        <Link to="/publicar" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nueva propiedad
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse flex gap-4">
              <div className="w-24 h-20 bg-gray-200 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Building2 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-4">Todavía no publicaste ninguna propiedad</p>
          <Link to="/publicar" className="btn-primary inline-flex items-center gap-2">
            <Plus size={18} /> Publicar primera propiedad
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map(property => {
            const statusCfg = STATUS_CONFIG[property.status]
            const StatusIcon = statusCfg.icon
            return (
              <div key={property.id} className="card p-4 flex gap-4 items-center">
                {property.images[0] ? (
                  <img
                    src={property.images[0].url}
                    alt={property.title}
                    className="w-24 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <Building2 size={24} className="text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{property.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{property.address}, {property.city}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${statusCfg.color}`}>
                      <StatusIcon size={12} /> {statusCfg.label}
                    </span>
                    <span className="text-sm font-semibold text-primary-700">
                      {property.currency} {property.price.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link to={`/propiedad/${property.id}`} className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="Ver">
                    <Eye size={18} />
                  </Link>
                  <Link to={`/editar/${property.id}`} className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="Editar">
                    <Pencil size={18} />
                  </Link>
                  <button onClick={() => handleDelete(property.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Eliminar">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
