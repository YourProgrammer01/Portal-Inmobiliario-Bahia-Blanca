import { Bed, Bath, Maximize, Phone, MapPin, ShieldCheck } from 'lucide-react'
import { Property } from '../../types'
import { ImageCarousel } from './ImageCarousel'

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
  onClick: () => void
}

export const PropertyCard = ({ property, onClick }: Props) => {
  const publisherName = property.agency?.name
    ?? `${property.particular?.firstName} ${property.particular?.lastName}`

  return (
    <div
      className="card hover:shadow-md transition-shadow duration-200 flex flex-col cursor-pointer"
      onClick={onClick}
    >
      {/* Carrusel — detiene propagación para que deslizar no abra el modal */}
      <div className="relative" onClick={e => e.stopPropagation()}>
        <ImageCarousel images={property.images} className="h-52" />
        <div className="absolute top-2 left-2 flex gap-1 pointer-events-none">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            property.operationType === 'RENT' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {OPERATION_TYPE_LABELS[property.operationType]}
          </span>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
            {PROPERTY_TYPE_LABELS[property.propertyType]}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <p className="text-xl font-bold text-primary-700">
          {formatPrice(property.price, property.currency)}
          {property.operationType === 'RENT' && <span className="text-sm font-normal text-gray-500">/mes</span>}
        </p>

        <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug">{property.title}</h3>

        <div className="flex items-center gap-1 text-gray-500 text-sm">
          <MapPin size={14} className="flex-shrink-0" />
          <span className="truncate">
            {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}
          </span>
        </div>

        <div className="flex items-center gap-4 text-gray-600 text-sm">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1"><Bed size={14} /> {property.bedrooms} dorm.</span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1"><Bath size={14} /> {property.bathrooms} baños</span>
          )}
          {property.squareMeters != null && (
            <span className="flex items-center gap-1"><Maximize size={14} /> {property.squareMeters} m²</span>
          )}
        </div>

        <p className="text-gray-500 text-sm line-clamp-2">{property.description}</p>

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-600 min-w-0">
            <ShieldCheck size={14} className="text-primary-600 flex-shrink-0" />
            <span className="truncate font-medium">{publisherName}</span>
          </div>
          <a
            href={`https://wa.me/${property.contactPhone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
          >
            <Phone size={13} /> Contactar
          </a>
        </div>
      </div>
    </div>
  )
}
