import api from './api'
import { PendingAgency, PendingParticular, DashboardStats } from '../hooks/useAdmin'

export const getDashboardStatsService = async (): Promise<DashboardStats> => {
  const { data } = await api.get<DashboardStats>('/admin/dashboard')
  return data
}

export const getPendingUsersService = async (): Promise<{
  agencies: PendingAgency[]
  particulars: PendingParticular[]
}> => {
  const { data } = await api.get('/admin/pending')
  return data
}

export const getDocumentUrlsService = async (
  type: 'agency' | 'particular',
  id: string
): Promise<{ dniFront: string; dniBack: string; selfie: string }> => {
  const { data } = await api.get(`/admin/documents/${type}/${id}`)
  return data
}

export const verifyAgencyService = async (
  id: string,
  status: 'APPROVED' | 'REJECTED',
  rejectionReason?: string
): Promise<void> => {
  await api.patch(`/admin/verify/agency/${id}`, { status, rejectionReason })
}

export const verifyParticularService = async (
  id: string,
  status: 'APPROVED' | 'REJECTED',
  rejectionReason?: string
): Promise<void> => {
  await api.patch(`/admin/verify/particular/${id}`, { status, rejectionReason })
}

export const getAllUsersService = async (): Promise<AdminUser[]> => {
  const { data } = await api.get<AdminUser[]>('/admin/users')
  return data
}

export const toggleSuspendService = async (id: string): Promise<{ isSuspended: boolean }> => {
  const { data } = await api.patch<{ isSuspended: boolean }>(`/admin/users/${id}/suspend`)
  return data
}

export interface AdminUser {
  id: string
  email: string
  role: 'AGENCY' | 'PARTICULAR'
  isSuspended: boolean
  createdAt: string
  agency?: { id: string; name: string; phone: string; city: string; address: string; licenseNumber: string; isVerified: boolean }
  particular?: { id: string; firstName: string; lastName: string; phone: string; city: string; isVerified: boolean }
}
