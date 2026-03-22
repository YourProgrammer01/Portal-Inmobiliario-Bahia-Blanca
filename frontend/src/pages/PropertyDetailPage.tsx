import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Bed, Bath, Maximize, Phone, MapPin, ShieldCheck,
  ArrowLeft, Building2, User, Maximize2, Car
} from 'lucide-react'
import { Property } from '../types'
import { getPropertyByIdService } from '../services/property.service'
import { ImageCarousel } from '../components/ui/ImageCarousel'

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: 'Casa', APARTMENT: 'Departamento', LAND: 'Terreno',
  COMMERCIAL: 'Local Comercial', OFFICE: 'Oficina',
}

const OPERATION_TYPE_LABELS: Record<string, string> = {
  SALE: 'Venta', RENT: 'Alquiler',
}

const formatPrice = (price: number, currency: string) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    maximumFractionDigits: 0,
  }).format(price)

export const PropertyDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    getPropertyByIdService(id)
      .then(setProperty)
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-80 bg-gray-200 rounded-xl mb-6" />
      <div className="h-6 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
    </div>
  )

  if (notFound || !property) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <Building2 size={56} className="mx-auto mb-4 text-gray-300" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Propiedad no encontrada</h2>
      <Link to="/" className="btn-primary inline-flex items-center gap-2 mt-4">
        <ArrowLeft size={16} /> Volver al inicio
      </Link>
    </div>
  )

  const publisherName = property.agency?.name
    ?? `${property.particular?.firstName} ${property.particular?.lastName}`
  const publisherPhone = property.contactPhone
  const isAgency = !!property.agency

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Volver */}
      <Link to="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-primary-600 text-sm mb-4 transition-colors">
        <ArrowLeft size={16} /> Volver al listado
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carrusel grande */}
          <div className="card overflow-hidden">
            <ImageCarousel images={property.images} className="h-80 sm:h-96" />
          </div>

          {/* Título y badges */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                property.operationType === 'RENT'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {OPERATION_TYPE_LABELS[property.operationType]}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                {PROPERTY_TYPE_LABELS[property.propertyType]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
            <div className="flex items-center gap-1 text-gray-500 mt-2">
              <MapPin size={16} />
              <span>{property.address}{property.neighborhood ? `, ${property.neighborhood}` : ''}, {property.city}</span>
            </div>
          </div>

          {/* Características */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Características</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {property.bedrooms != null && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Bed size={18} className="text-primary-600" />
                  <div>
                    <p className="font-semibold">{property.bedrooms}</p>
                    <p className="text-xs text-gray-500">Dormitorios</p>
                  </div>
                </div>
              )}
              {property.bathrooms != null && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Bath size={18} className="text-primary-600" />
                  <div>
                    <p className="font-semibold">{property.bathrooms}</p>
                    <p className="text-xs text-gray-500">Baños</p>
                  </div>
                </div>
              )}
              {property.squareMeters != null && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Maximize size={18} className="text-primary-600" />
                  <div>
                    <p className="font-semibold">{property.squareMeters} m²</p>
                    <p className="text-xs text-gray-500">Sup. total</p>
                  </div>
                </div>
              )}
              {property.coveredMeters != null && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Maximize2 size={18} className="text-primary-600" />
                  <div>
                    <p className="font-semibold">{property.coveredMeters} m²</p>
                    <p className="text-xs text-gray-500">Sup. cubierta</p>
                  </div>
                </div>
              )}
              {property.garages != null && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Car size={18} className="text-primary-600" />
                  <div>
                    <p className="font-semibold">{property.garages}</p>
                    <p className="text-xs text-gray-500">Cocheras</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Descripción</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
          </div>

          {/* Galería por ambientes */}
          {property.images.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Fotos por ambiente</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.images.map(img => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden">
                    <img
                      src={img.url}
                      alt={img.room}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <span className="text-white text-xs font-medium">{img.room}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Precio */}
          <div className="card p-5">
            <p className="text-3xl font-bold text-primary-700">
              {formatPrice(property.price, property.currency)}
            </p>
            {property.operationType === 'RENT' && (
              <p className="text-gray-500 text-sm mt-1">por mes</p>
            )}
          </div>

          {/* Contacto */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2">
              {isAgency
                ? <Building2 size={20} className="text-primary-600" />
                : <User size={20} className="text-primary-600" />
              }
              <div>
                <p className="font-semibold text-gray-900">{publisherName}</p>
                <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <ShieldCheck size={12} />
                  {isAgency ? 'Inmobiliaria verificada' : 'Particular verificado'}
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/${publisherPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, vi la propiedad "${property.title}" en PIB y me interesa más información.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-lg transition-colors"
            >
              <Phone size={18} /> Contactar por WhatsApp
            </a>

            <a
              href={`tel:${publisherPhone}`}
              className="flex items-center justify-center gap-2 w-full btn-secondary py-3"
            >
              <Phone size={18} /> {publisherPhone}
            </a>
          </div>

          {/* Info adicional */}
          <div className="card p-5 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Ciudad</span>
              <span className="font-medium text-gray-900">{property.city}</span>
            </div>
            {property.neighborhood && (
              <div className="flex justify-between">
                <span>Barrio</span>
                <span className="font-medium text-gray-900">{property.neighborhood}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Publicado por</span>
              <span className="font-medium text-gray-900">{isAgency ? 'Inmobiliaria' : 'Particular'}</span>
            </div>
            <div className="flex justify-between">
              <span>Moneda</span>
              <span className="font-medium text-gray-900">{property.currency}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
