import { useState, useEffect } from 'react'
import { Building2, Users, ShieldCheck, TrendingUp } from 'lucide-react'
import { Property, PropertyFilters } from '../types'
import { getPropertiesService } from '../services/property.service'
import { PropertyCard } from '../components/ui/PropertyCard'
import { PropertyFiltersBar } from '../components/ui/PropertyFiltersBar'

interface Props {
  defaultOperationType?: 'SALE' | 'RENT'
}

export const HomePage = ({ defaultOperationType }: Props) => {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })
  const [filters, setFilters] = useState<PropertyFilters>({
    city: 'Bahia Blanca',
    page: 1,
    limit: 12,
    operationType: defaultOperationType,
  })

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true)
      try {
        const result = await getPropertiesService(filters)
        setProperties(result.data)
        setPagination(result.pagination)
      } catch {
        setProperties([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchProperties()
  }, [filters])

  const handleFilter = (newFilters: PropertyFilters) => {
    setFilters({ ...newFilters, page: 1 })
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-800 to-primary-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Encontrá tu próxima propiedad en Bahía Blanca
          </h1>
          <p className="text-primary-100 text-lg mb-8">
            El portal inmobiliario con agentes verificados y particulares de confianza
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
            {[
              { icon: Building2, label: 'Propiedades', value: pagination.total.toString() },
              { icon: ShieldCheck, label: 'Agentes verificados', value: '100%' },
              { icon: Users, label: 'Particulares', value: 'Verificados' },
              { icon: TrendingUp, label: 'Ciudad', value: 'Bahía Blanca' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-4">
                <Icon size={24} className="mx-auto mb-2 text-primary-200" />
                <p className="font-bold text-lg">{value}</p>
                <p className="text-primary-200 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PropertyFiltersBar onFilter={handleFilter} />

        <div className="mt-6 flex items-center justify-between">
          <p className="text-gray-600 text-sm">
            {isLoading ? 'Buscando...' : `${pagination.total} propiedades encontradas`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-52 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Building2 size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">No se encontraron propiedades con esos filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-4">
            {properties.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button
              disabled={pagination.page === 1}
              onClick={() => setFilters(f => ({ ...f, page: f.page! - 1 }))}
              className="btn-secondary text-sm disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="flex items-center text-sm text-gray-600 px-4">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setFilters(f => ({ ...f, page: f.page! + 1 }))}
              className="btn-secondary text-sm disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
