import { useForm } from 'react-hook-form'
import { Search, SlidersHorizontal } from 'lucide-react'
import { PropertyFilters, OperationType } from '../../types'
import { useState } from 'react'

interface Props {
  onFilter: (filters: PropertyFilters) => void
  defaultOperationType?: OperationType
}

export const PropertyFiltersBar = ({ onFilter, defaultOperationType }: Props) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const { register, handleSubmit, reset } = useForm<PropertyFilters>({
    defaultValues: { operationType: defaultOperationType, city: 'Bahia Blanca', page: 1, limit: 12 },
  })

  const onSubmit = (data: PropertyFilters) => {
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined)
    ) as PropertyFilters
    onFilter({ ...clean, page: 1 })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Operación */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Operación</label>
          <select className="input-field text-sm" {...register('operationType')}>
            <option value="">Todas</option>
            <option value="SALE">Venta</option>
            <option value="RENT">Alquiler</option>
          </select>
        </div>

        {/* Tipo de propiedad */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
          <select className="input-field text-sm" {...register('propertyType')}>
            <option value="">Todos</option>
            <option value="HOUSE">Casa</option>
            <option value="APARTMENT">Departamento</option>
            <option value="LAND">Terreno</option>
            <option value="COMMERCIAL">Local Comercial</option>
            <option value="OFFICE">Oficina</option>
          </select>
        </div>

        {/* Barrio */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Barrio</label>
          <input className="input-field text-sm" placeholder="Ej: Centro" {...register('neighborhood')} />
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn-secondary text-sm py-2 flex items-center gap-1"
          >
            <SlidersHorizontal size={15} /> Más filtros
          </button>
          <button type="submit" className="btn-primary text-sm py-2 flex items-center gap-1">
            <Search size={15} /> Buscar
          </button>
        </div>
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Precio mín.</label>
            <input type="number" className="input-field text-sm" placeholder="0" {...register('minPrice', { valueAsNumber: true })} />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Precio máx.</label>
            <input type="number" className="input-field text-sm" placeholder="Sin límite" {...register('maxPrice', { valueAsNumber: true })} />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Dormitorios</label>
            <select className="input-field text-sm" {...register('bedrooms', { valueAsNumber: true })}>
              <option value="">Cualquiera</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Publicado por</label>
            <select className="input-field text-sm" {...register('publisherType')}>
              <option value="">Todos</option>
              <option value="AGENCY">Inmobiliaria</option>
              <option value="PARTICULAR">Particular</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => { reset(); onFilter({ city: 'Bahia Blanca', page: 1, limit: 12 }) }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Limpiar
          </button>
        </div>
      )}
    </form>
  )
}
