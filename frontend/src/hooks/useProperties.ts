import { useState, useEffect, useCallback } from 'react'
import { Property, PropertyFilters, PaginatedResponse } from '../types'
import { getPropertiesService } from '../services/property.service'

interface UsePropertiesReturn {
  properties: Property[]
  pagination: { total: number; page: number; totalPages: number }
  isLoading: boolean
  error: string
  setFilters: (filters: PropertyFilters) => void
  filters: PropertyFilters
}

export const useProperties = (initialFilters: PropertyFilters = {}): UsePropertiesReturn => {
  const [filters, setFilters] = useState<PropertyFilters>({
    city: 'Bahia Blanca',
    page: 1,
    limit: 12,
    ...initialFilters,
  })
  const [properties, setProperties] = useState<Property[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchProperties = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const result: PaginatedResponse<Property> = await getPropertiesService(filters)
      setProperties(result.data)
      setPagination(result.pagination)
    } catch {
      setError('Error al cargar las propiedades')
      setProperties([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchProperties() }, [fetchProperties])

  return { properties, pagination, isLoading, error, setFilters, filters }
}
