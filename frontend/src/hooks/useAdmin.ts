import { useState, useEffect } from 'react'
import { getPendingUsersService, getDashboardStatsService } from '../services/admin.service'

export interface PendingAgency {
  id: string
  name: string
  phone: string
  city: string
  licenseNumber: string
  verificationStatus: string
  user: { email: string; createdAt: string }
}

export interface PendingParticular {
  id: string
  firstName: string
  lastName: string
  phone: string
  city: string
  verificationStatus: string
  user: { email: string; createdAt: string }
}

export interface DashboardStats {
  totalProperties: number
  totalAgencies: number
  totalParticulars: number
  pendingVerifications: number
}

export const useAdmin = () => {
  const [pendingAgencies, setPendingAgencies] = useState<PendingAgency[]>([])
  const [pendingParticulars, setPendingParticulars] = useState<PendingParticular[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const [pending, dashStats] = await Promise.all([
        getPendingUsersService(),
        getDashboardStatsService(),
      ])
      setPendingAgencies(pending.agencies)
      setPendingParticulars(pending.particulars)
      setStats(dashStats)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  return { pendingAgencies, pendingParticulars, stats, isLoading, refetch: fetchAll }
}
