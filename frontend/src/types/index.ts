export type UserRole = 'ADMIN' | 'AGENCY' | 'PARTICULAR'
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type PropertyType = 'HOUSE' | 'APARTMENT' | 'LAND' | 'COMMERCIAL' | 'OFFICE'
export type OperationType = 'SALE' | 'RENT'
export type PublisherType = 'AGENCY' | 'PARTICULAR'
export type PropertyStatus = 'ACTIVE' | 'PAUSED' | 'SOLD' | 'RENTED'

export interface User {
  id: string
  email: string
  role: UserRole
  name: string
  isVerified: boolean
}

export interface PropertyImage {
  id: string
  url: string
  room: string
  order: number
}

export interface Property {
  id: string
  title: string
  description: string
  price: number
  currency: 'ARS' | 'USD'
  operationType: OperationType
  propertyType: PropertyType
  publisherType: PublisherType
  status: PropertyStatus
  city: string
  neighborhood?: string
  address: string
  bedrooms?: number
  bathrooms?: number
  squareMeters?: number
  coveredMeters?: number
  garages?: number
  contactPhone: string
  images: PropertyImage[]
  agency?: { name: string; phone: string; logoUrl?: string }
  particular?: { firstName: string; lastName: string; phone: string }
  createdAt: string
}

export interface PropertyFilters {
  city?: string
  operationType?: OperationType
  propertyType?: PropertyType
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  neighborhood?: string
  publisherType?: PublisherType
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AuthResponse {
  accessToken: string
  user: User
}
