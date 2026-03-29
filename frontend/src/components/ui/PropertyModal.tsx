import { useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import {
  X, ChevronLeft, ChevronRight, MapPin, Bed, Bath,
  Maximize, Car, Phone, ShieldCheck
} from 'lucide-react'
import { Property } from '../../types'

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: 'Casa', APARTMENT: 'Departamento', LAND: 'Terreno',
  COMMERCIAL: 'Local Comercial', OFFICE: 'Oficina',
}
const OPERATION_TYPE_LABELS: Record<string, string> = { SALE: 'Venta', RENT: 'Alquiler' }

const formatPrice = (price: number, currency: string) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    maximumFractionDigits: 0,
  }).format(price)

interface Props {
  property: Property
  onClose: () => void
}

export const PropertyModal = ({ property, onClose }: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const publisherName = property.agency?.name
    ?? `${property.particular?.firstName} ${property.particular?.lastName}`

  const waUrl = `https://wa.me/${property.contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, me interesa la propiedad "${property.title}" publicada en PIB.`)}`

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Carrusel grande */}
        <div className="relative h-72 sm:h-96 bg-gray-100 rounded-t-2xl overflow-hidden">
          {property.images.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400">Sin imágenes</div>
          ) : (
            <>
              <div className="overflow-hidden h-full" ref={emblaRef}>
                <div className="flex h-full">
                  {property.images.map(img => (
                    <div key={img.id} className="flex-none w-full h-full relative">
                      <img src={img.url} alt={img.room} className="w-full h-full object-cover" />
                      <span className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        {img.room}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {property.images.length > 1 && (
                <>
                  <button onClick={scrollPrev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow transition-all">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={scrollNext} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow transition-all">
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    {property.images.length} fotos
                  </div>
                </>
              )}
            </>
          )}

          {/* Badges + cerrar */}
          <div className="absolute top-3 left-3 flex gap-1">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              property.operationType === 'RENT' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>{OPERATION_TYPE_LABELS[property.operationType]}</span>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
              {PROPERTY_TYPE_LABELS[property.propertyType]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Detalle */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{property.title}</h2>
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <MapPin size={14} />
                <span>{property.address}{property.neighborhood ? `, ${property.neighborhood}` : ''}, {property.city}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-primary-700 flex-shrink-0">
              {formatPrice(property.price, property.currency)}
              {property.operationType === 'RENT' && <span className="text-sm font-normal text-gray-500">/mes</span>}
            </p>
          </div>

          {/* Características */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 py-3 border-y border-gray-100">
            {property.bedrooms != null && (
              <span className="flex items-center gap-1.5"><Bed size={16} className="text-primary-500" /> {property.bedrooms} dormitorios</span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1.5"><Bath size={16} className="text-primary-500" /> {property.bathrooms} baños</span>
            )}
            {property.squareMeters != null && (
              <span className="flex items-center gap-1.5"><Maximize size={16} className="text-primary-500" /> {property.squareMeters} m² totales</span>
            )}
            {property.coveredMeters != null && (
              <span className="flex items-center gap-1.5"><Maximize size={16} className="text-primary-500" /> {property.coveredMeters} m² cubiertos</span>
            )}
            {property.garages != null && (
              <span className="flex items-center gap-1.5"><Car size={16} className="text-primary-500" /> {property.garages} cochera{property.garages > 1 ? 's' : ''}</span>
            )}
          </div>

          {/* Descripción */}
          <p className="text-gray-600 text-sm leading-relaxed">{property.description}</p>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <ShieldCheck size={16} className="text-primary-600" />
              <span className="font-medium">{publisherName}</span>
            </div>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Phone size={15} /> Contactar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
