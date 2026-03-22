import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle } from 'lucide-react'
import { getPropertyByIdService, updatePropertyService } from '../services/property.service'

const phoneRegex = /^(\+54|0)?[1-9]\d{9,10}$/

const schema = z.object({
  title: z.string().min(5).max(150),
  description: z.string().min(20).max(2000),
  price: z.coerce.number().positive(),
  currency: z.enum(['ARS', 'USD']),
  operationType: z.enum(['SALE', 'RENT']),
  propertyType: z.enum(['HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL', 'OFFICE']),
  city: z.string().min(2),
  neighborhood: z.string().max(100).optional(),
  address: z.string().min(5),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  squareMeters: z.coerce.number().positive().optional(),
  coveredMeters: z.coerce.number().positive().optional(),
  garages: z.coerce.number().int().min(0).optional(),
  contactPhone: z.string().regex(phoneRegex, 'Teléfono inválido'),
  status: z.enum(['ACTIVE', 'PAUSED', 'SOLD', 'RENTED']),
})

type EditForm = z.infer<typeof schema>

export const EditPropertyPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!id) return
    getPropertyByIdService(id)
      .then(p => reset({
        title: p.title,
        description: p.description,
        price: p.price,
        currency: p.currency,
        operationType: p.operationType,
        propertyType: p.propertyType,
        city: p.city,
        neighborhood: p.neighborhood ?? '',
        address: p.address,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        squareMeters: p.squareMeters,
        coveredMeters: p.coveredMeters,
        garages: p.garages,
        contactPhone: p.contactPhone,
        status: p.status,
      }))
      .finally(() => setIsFetching(false))
  }, [id, reset])

  const onSubmit = async (data: EditForm) => {
    if (!id) return
    setIsLoading(true)
    setError('')
    try {
      await updatePropertyService(id, data)
      setSuccess(true)
    } catch {
      setError('Error al actualizar la propiedad')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="h-40 bg-gray-200 rounded-xl" />
      <div className="h-40 bg-gray-200 rounded-xl" />
    </div>
  )

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full text-center">
        <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Propiedad actualizada!</h2>
        <div className="flex gap-3 mt-6">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">Dashboard</button>
          <button onClick={() => navigate(`/propiedad/${id}`)} className="btn-primary flex-1">Ver propiedad</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar propiedad</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Información básica</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input className="input-field" {...register('title')} />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operación *</label>
              <select className="input-field" {...register('operationType')}>
                <option value="SALE">Venta</option>
                <option value="RENT">Alquiler</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select className="input-field" {...register('propertyType')}>
                <option value="HOUSE">Casa</option>
                <option value="APARTMENT">Departamento</option>
                <option value="LAND">Terreno</option>
                <option value="COMMERCIAL">Local Comercial</option>
                <option value="OFFICE">Oficina</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
              <input type="number" className="input-field" {...register('price')} />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda *</label>
              <select className="input-field" {...register('currency')}>
                <option value="ARS">ARS (Pesos)</option>
                <option value="USD">USD (Dólares)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
              <select className="input-field" {...register('status')}>
                <option value="ACTIVE">Activa</option>
                <option value="PAUSED">Pausada</option>
                <option value="SOLD">Vendida</option>
                <option value="RENTED">Alquilada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
              <input className="input-field" {...register('contactPhone')} />
              {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
              <textarea rows={4} className="input-field resize-none" {...register('description')} />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Ubicación</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
              <input className="input-field" {...register('city')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barrio</label>
              <input className="input-field" {...register('neighborhood')} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
              <input className="input-field" {...register('address')} />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Características</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dormitorios</label>
              <input type="number" min="0" className="input-field" {...register('bedrooms')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Baños</label>
              <input type="number" min="0" className="input-field" {...register('bathrooms')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cocheras</label>
              <input type="number" min="0" className="input-field" {...register('garages')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sup. total (m²)</label>
              <input type="number" min="0" className="input-field" {...register('squareMeters')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sup. cubierta (m²)</label>
              <input type="number" min="0" className="input-field" {...register('coveredMeters')} />
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1 py-3">
            Cancelar
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary flex-1 py-3">
            {isLoading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
