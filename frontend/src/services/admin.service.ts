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
