import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, Upload, X, Trash2 } from 'lucide-react'
import {
  getPropertyByIdService, updatePropertyService,
  addPropertyImagesService, deletePropertyImageService,
} from '../services/property.service'
import { PropertyImage } from '../types'

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

interface NewFile { room: string; file: File; preview: string }

export const EditPropertyPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [currentImages, setCurrentImages] = useState<PropertyImage[]>([])
  const [newFiles, setNewFiles] = useState<NewFile[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uploadingImages, setUploadingImages] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!id) return
    getPropertyByIdService(id)
      .then(p => {
        setCurrentImages(p.images)
        reset({
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
        })
      })
      .finally(() => setIsFetching(false))
  }, [id, reset])

  const handleDeleteImage = async (imageId: string) => {
    if (!id || !confirm('¿Eliminar esta imagen?')) return
    setDeletingId(imageId)
    try {
      await deletePropertyImageService(id, imageId)
      setCurrentImages(prev => prev.filter(img => img.id !== imageId))
    } catch {
      setError('Error al eliminar la imagen')
    } finally {
      setDeletingId(null)
    }
  }

  const handleAddFile = (room: string, file: File) => {
    const preview = URL.createObjectURL(file)
    setNewFiles(prev => [...prev, { room, file, preview }])
  }

  const removeNewFile = (index: number) => {
    setNewFiles(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleUploadNewImages = async () => {
    if (!id || newFiles.length === 0) return
    setUploadingImages(true)
    setError('')
    try {
      const formData = new FormData()
      newFiles.forEach(({ room, file }) => formData.append(`${room}_image`, file))
      const result = await addPropertyImagesService(id, formData)
      setCurrentImages(result.images)
      setNewFiles([])
    } catch {
      setError('Error al subir las imágenes')
    } finally {
      setUploadingImages(false)
    }
  }

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

        {/* Gestión de imágenes */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Imágenes</h2>

          {/* Fotos actuales */}
          {currentImages.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-3">Fotos actuales — hacé clic en la X para eliminar</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {currentImages.map(img => (
                  <div key={img.id} className="relative group">
                    <img src={img.url} alt={img.room} className="w-full h-24 object-cover rounded-lg" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1">
                      <span className="text-white text-xs text-center px-1">{img.room}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        disabled={deletingId === img.id}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors disabled:opacity-50"
                      >
                        {deletingId === img.id
                          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agregar nuevas fotos */}
          <div>
            <p className="text-sm text-gray-500 mb-3">Agregar nuevas fotos por ambiente</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ROOMS.map(room => (
                <label key={room.key} className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-200 hover:border-primary-400 rounded-xl p-3 cursor-pointer transition-colors text-center">
                  <Upload size={18} className="text-gray-400" />
                  <span className="text-xs text-gray-600">{room.label}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={e => Array.from(e.target.files ?? []).forEach(f => handleAddFile(room.key, f))}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Preview nuevas fotos */}
          {newFiles.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {newFiles.map((nf, i) => (
                  <div key={i} className="relative group">
                    <img src={nf.preview} alt={nf.room} className="w-full h-24 object-cover rounded-lg border-2 border-primary-300" />
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                      {ROOMS.find(r => r.key === nf.room)?.label ?? nf.room}
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleUploadNewImages}
                disabled={uploadingImages}
                className="btn-primary text-sm py-2 flex items-center gap-2"
              >
                {uploadingImages
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Subiendo...</>
                  : <><Upload size={15} /> Subir {newFiles.length} foto{newFiles.length > 1 ? 's' : ''} nueva{newFiles.length > 1 ? 's' : ''}</>
                }
              </button>
            </div>
          )}
        </div>

        {/* Información básica */}
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
              <input className="input-field" {...register('neighborhood')} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
              <input className="input-field" {...register('address')} />
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
