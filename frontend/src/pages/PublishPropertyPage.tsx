import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Upload, X, CheckCircle } from 'lucide-react'
import { createPropertyService } from '../services/property.service'

const phoneRegex = /^(\+54|0)?[1-9]\d{9,10}$/

const schema = z.object({
  title: z.string().min(5, 'Mínimo 5 caracteres').max(150),
  description: z.string().min(20, 'Mínimo 20 caracteres').max(2000),
  price: z.coerce.number().positive('Precio requerido'),
  currency: z.enum(['ARS', 'USD']),
  operationType: z.enum(['SALE', 'RENT']),
  propertyType: z.enum(['HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL', 'OFFICE']),
  city: z.string().min(2),
  neighborhood: z.string().max(100).optional(),
  address: z.string().min(5, 'Dirección requerida'),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  squareMeters: z.coerce.number().positive().optional(),
  coveredMeters: z.coerce.number().positive().optional(),
  garages: z.coerce.number().int().min(0).optional(),
  contactPhone: z.string().regex(phoneRegex, 'Teléfono inválido'),
})

type PropertyForm = z.infer<typeof schema>

const ROOMS = [
  { key: 'exterior', label: 'Frente / Exterior' },
  { key: 'living', label: 'Living / Comedor' },
  { key: 'kitchen', label: 'Cocina' },
  { key: 'bedroom', label: 'Dormitorio' },
  { key: 'bathroom', label: 'Baño' },
  { key: 'garage', label: 'Garage / Cochera' },
  { key: 'garden', label: 'Jardín / Patio / Terraza' },
  { key: 'other', label: 'Otros' },
]

interface RoomFile { room: string; file: File; preview: string }

export const PublishPropertyPage = () => {
  const navigate = useNavigate()
  const [roomFiles, setRoomFiles] = useState<RoomFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<PropertyForm>({
    resolver: zodResolver(schema),
    defaultValues: { city: 'Bahia Blanca', currency: 'ARS', operationType: 'SALE', propertyType: 'HOUSE' },
  })

  const handleRoomFile = (room: string, file: File | null) => {
    if (!file) return
    const preview = URL.createObjectURL(file)
    setRoomFiles(prev => [...prev, { room, file, preview }])
  }

  const removeFile = (index: number) => {
    setRoomFiles(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const onSubmit = async (data: PropertyForm) => {
    if (roomFiles.length === 0) {
      setError('Debés subir al menos una foto de la propiedad')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== '') formData.append(k, String(v))
      })
      roomFiles.forEach(({ room, file }) => {
        formData.append(`${room}_image`, file)
      })
      await createPropertyService(formData)
      setSuccess(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Error al publicar la propiedad')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Propiedad publicada!</h2>
          <p className="text-gray-600 mb-6">Tu propiedad ya está visible en el portal.</p>
          <div className="flex gap-3">
            <button onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">Ir al dashboard</button>
            <button onClick={() => { setSuccess(false); setRoomFiles([]) }} className="btn-primary flex-1">Publicar otra</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Publicar propiedad</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información básica */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Información básica</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input className="input-field" placeholder="Ej: Casa 3 dormitorios con jardín en Palihue" {...register('title')} />
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
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
              <textarea rows={4} className="input-field resize-none" placeholder="Describí la propiedad en detalle..." {...register('description')} />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Ubicación</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
              <input className="input-field" {...register('city')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barrio</label>
              <input className="input-field" placeholder="Ej: Centro, Palihue..." {...register('neighborhood')} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
              <input className="input-field" placeholder="Ej: Av. Alem 1234" {...register('address')} />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>
          </div>
        </div>

        {/* Características */}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de contacto *</label>
              <input className="input-field" placeholder="+54291..." {...register('contactPhone')} />
              {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone.message}</p>}
            </div>
          </div>
        </div>

        {/* Fotos por ambiente */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Fotos por ambiente</h2>
          <p className="text-sm text-gray-500">Subí fotos de cada ambiente para mostrar mejor la propiedad</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ROOMS.map(room => (
              <label key={room.key} className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-primary-400 rounded-xl p-4 cursor-pointer transition-colors text-center">
                <Upload size={20} className="text-gray-400" />
                <span className="text-xs text-gray-600 font-medium">{room.label}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    Array.from(e.target.files ?? []).forEach(f => handleRoomFile(room.key, f))
                  }}
                />
              </label>
            ))}
          </div>

          {/* Preview de fotos cargadas */}
          {roomFiles.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
              {roomFiles.map((rf, i) => (
                <div key={i} className="relative group">
                  <img src={rf.preview} alt={rf.room} className="w-full h-20 object-cover rounded-lg" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <button type="button" onClick={() => removeFile(i)} className="text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded truncate max-w-full">
                    {ROOMS.find(r => r.key === rf.room)?.label ?? rf.room}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-base">
          {isLoading ? 'Publicando...' : 'Publicar propiedad'}
        </button>
      </form>
    </div>
  )
}
