import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { UserRole } from '../../types'

interface Props {
  children: React.ReactNode
  roles?: UserRole[]
}

export const ProtectedRoute = ({ children, roles }: Props) => {
  const { user, isLoading } = useAuth()

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return <>{children}</>
}
