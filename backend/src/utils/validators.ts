import { z } from 'zod'

const phoneRegex = /^(\+54|0)?[1-9]\d{9,10}$/
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// --- Auth ---
export const registerAgencySchema = z.object({
  email: z.string().email().max(100).toLowerCase().trim(),
  password: z.string().regex(passwordRegex, {
    message: 'La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo',
  }),
  name: z.string().min(2).max(100).trim(),
  phone: z.string().regex(phoneRegex, 'Teléfono inválido').trim(),
  address: z.string().min(5).max(200).trim(),
  city: z.string().min(2).max(100).trim(),
  licenseNumber: z.string().min(3).max(50).trim(),
})

export const registerParticularSchema = z.object({
  email: z.string().email().max(100).toLowerCase().trim(),
  password: z.string().regex(passwordRegex, {
    message: 'La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo',
  }),
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  phone: z.string().regex(phoneRegex, 'Teléfono inválido').trim(),
  city: z.string().min(2).max(100).trim(),
})

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1).max(200),
  totpCode: z.string().length(6).optional(),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).optional(),
})

// --- Propiedades ---
export const createPropertySchema = z.object({
  title: z.string().min(5).max(150).trim(),
  description: z.string().min(20).max(2000).trim(),
  price: z.coerce.number().positive().max(999999999),
  currency: z.enum(['ARS', 'USD']).default('ARS'),
  operationType: z.enum(['SALE', 'RENT']),
  propertyType: z.enum(['HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL', 'OFFICE']),
  city: z.string().min(2).max(100).trim(),
  neighborhood: z.string().max(100).trim().optional(),
  address: z.string().min(5).max(200).trim(),
  bedrooms: z.coerce.number().int().min(0).max(20).optional(),
  bathrooms: z.coerce.number().int().min(0).max(10).optional(),
  squareMeters: z.coerce.number().positive().max(99999).optional(),
  coveredMeters: z.coerce.number().positive().max(99999).optional(),
  garages: z.coerce.number().int().min(0).max(10).optional(),
  contactPhone: z.string().regex(phoneRegex, 'Teléfono inválido').trim(),
})

export const updatePropertySchema = createPropertySchema.partial()

export const propertyFiltersSchema = z.object({
  city: z.string().max(100).trim().optional(),
  operationType: z.enum(['SALE', 'RENT']).optional(),
  propertyType: z.enum(['HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL', 'OFFICE']).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  neighborhood: z.string().max(100).trim().optional(),
  publisherType: z.enum(['AGENCY', 'PARTICULAR']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
})

// --- Admin ---
export const verifyUserSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().max(500).trim().optional(),
})
