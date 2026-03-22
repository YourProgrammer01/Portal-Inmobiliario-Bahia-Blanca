import api from './api'
import { Property, PropertyFilters, PaginatedResponse, AuthResponse } from '../types'

// --- Auth ---
export const loginService = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
  return data
}

export const logoutService = async (): Promise<void> => {
  await api.post('/auth/logout')
  sessionStorage.removeItem('accessToken')
}

export const registerAgencyService = async (formData: FormData): Promise<{ message: string }> => {
  const { data } = await api.post('/auth/register/agency', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const registerParticularService = async (formData: FormData): Promise<{ message: string }> => {
  const { data } = await api.post('/auth/register/particular', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// --- Properties ---
export const getPropertiesService = async (
  filters: PropertyFilters = {}
): Promise<PaginatedResponse<Property>> => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  )
  const { data } = await api.get<PaginatedResponse<Property>>('/properties', { params })
  return data
}

export const getPropertyByIdService = async (id: string): Promise<Property> => {
  const { data } = await api.get<Property>(`/properties/${id}`)
  return data
}

export const createPropertyService = async (formData: FormData): Promise<Property> => {
  const { data } = await api.post<Property>('/properties', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const updatePropertyService = async (id: string, body: Partial<Property>): Promise<Property> => {
  const { data } = await api.patch<Property>(`/properties/${id}`, body)
  return data
}

export const deletePropertyService = async (id: string): Promise<void> => {
  await api.delete(`/properties/${id}`)
}

export const getMyPropertiesService = async (): Promise<Property[]> => {
  const { data } = await api.get<Property[]>('/properties/my')
  return data
}
