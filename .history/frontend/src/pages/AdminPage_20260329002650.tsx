import { useState } from 'react'
import {
  Building2, Users, ShieldCheck, Clock, CheckCircle,
  XCircle, Eye, LayoutDashboard, FileText, UserX, UserCheck, MapPin, Settings
} from 'lucide-react'
import { useAdmin, PendingAgency, PendingParticular } from '../hooks/useAdmin'
import {
  verifyAgencyService, verifyParticularService, getDocumentUrlsService,
  getAllUsersService, toggleSuspendService, AdminUser
} from '../services/admin.service'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

type Tab = 'dashboard' | 'agencies' | 'particulars' | 'users' | 'settings'

const StatCard = ({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number | string; color: string
}) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
)

interface DocumentModalProps {
  type: 'agency' | 'particular'
  id: string
  name: string
  onClose: () => void
}

const DocumentModal = ({ type, id, name, onClose }: DocumentModalProps) => {
  const [docs, setDocs] = useState<{ dniFront: string; dniBack: string; selfie: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useState(() => {
    getDocumentUrlsService(type, id)
      .then(setDocs)
      .finally(() => setLoading(false))
  })

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Documentos — {name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={22} />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse" />)}
          </div>
        ) : docs ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'DNI Frente', url: docs.dniFront },
              { label: 'DNI Dorso', url: docs.dniBack },
              { label: 'Selfie con DNI', url: docs.selfie },
            ].map(({ label, url }) => (
              <div key={label}>
                <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
                <img src={url} alt={label} className="w-full h-40 object-cover rounded-lg border border-gray-200" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No se pudieron cargar los documentos</p>
        )}
      </div>
    </div>
  )
}

interface VerifyCardProps {
  name: string
  email: string
  phone: string
  city: string
  extra?: string
  createdAt: string
  onViewDocs: () => void
  onApprove: () => void
  onReject: (reason: string) => void
  isProcessing: boolean
}

const VerifyCard = ({ name, email, phone, city, extra, createdAt, onViewDocs, onApprove, onReject, isProcessing }: VerifyCardProps) => {
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">{email}</p>
          <p className="text-sm text-gray-500">{phone} · {city}</p>
          {extra && <p className="text-xs text-gray-400 mt-1">Matrícula: {extra}</p>}
          <p className="text-xs text-gray-400">
            Registrado: {new Date(createdAt).toLocaleDateString('es-AR')}
          </p>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 flex-shrink-0">
          <Clock size={12} /> Pendiente
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button onClick={onViewDocs} className="flex items-center gap-1 btn-secondary text-xs py-1.5">
          <Eye size={13} /> Ver documentos
        </button>
        <button
          onClick={onApprove}
          disabled={isProcessing}
          className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <CheckCircle size={13} /> Aprobar
        </button>
        <button
          onClick={() => setShowReject(!showReject)}
          disabled={isProcessing}
          className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <XCircle size={13} /> Rechazar
        </button>
      </div>

      {showReject && (
        <div className="space-y-2 pt-1">
          <textarea
            className="input-field text-sm resize-none"
            rows={2}
            placeholder="Motivo del rechazo..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <button
            onClick={() => { if (reason.trim()) { onReject(reason); setShowReject(false) } }}
            disabled={!reason.trim() || isProcessing}
            className="btn-primary text-xs py-1.5 w-full disabled:opacity-50"
          >
            Confirmar rechazo
          </button>
        </div>
      )}
    </div>
  )
}

export const AdminPage = () => {
  const { pendingAgencies, pendingParticulars, stats, isLoading, refetch } = useAdmin()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [processing, setProcessing] = useState<string | null>(null)
  const [docModal, setDocModal] = useState<{ type: 'agency' | 'particular'; id: string; name: string } | null>(null)
  const [allUsers, setAllUsers] = useState<AdminUser[] | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userModal, setUserModal] = useState<AdminUser | null>(null)

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      setAllUsers(await getAllUsersService())
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleTabChange = (t: Tab) => {
    setTab(t)
    if (t === 'users' && !allUsers) loadUsers()
  }

  const handleToggleSuspend = async (userId: string) => {
    setProcessing(userId)
    try {
      const { isSuspended } = await toggleSuspendService(userId)
      setAllUsers(prev => prev?.map(u => u.id === userId ? { ...u, isSuspended } : u) ?? null)
    } finally {
      setProcessing(null)
    }
  }

  const { logout } = useAuth()
  const [credForm, setCredForm] = useState({ currentPassword: '', newEmail: '', newPassword: '' })
  const [credMsg, setCredMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [credLoading, setCredLoading] = useState(false)

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setCredMsg(null)
    setCredLoading(true)
    try {
      const payload: Record<string, string> = { currentPassword: credForm.currentPassword }
      if (credForm.newEmail) payload.newEmail = credForm.newEmail
      if (credForm.newPassword) payload.newPassword = credForm.newPassword
      await api.patch('/admin/credentials', payload)
      setCredMsg({ type: 'success', text: 'Credenciales actualizadas. Cerrando sesión...' })
      setTimeout(() => logout(), 2000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setCredMsg({ type: 'error', text: msg ?? 'Error al actualizar credenciales' })
    } finally {
      setCredLoading(false)
    }
  }
    setProcessing(id)
    try {
      await verifyAgencyService(id, status, reason)
      await refetch()
    } finally {
      setProcessing(null)
    }
  }

  const handleVerifyParticular = async (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    setProcessing(id)
    try {
      await verifyParticularService(id, status, reason)
      await refetch()
    } finally {
      setProcessing(null)
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'agencies', label: 'Inmobiliarias', icon: Building2, badge: pendingAgencies.length },
    { key: 'particulars', label: 'Particulares', icon: Users, badge: pendingParticulars.length },
    { key: 'users', label: 'Usuarios', icon: UserX },
    { key: 'settings', label: 'Configuración', icon: Settings },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary-600 text-white p-2 rounded-lg">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-500 text-sm">PIB — Portal Inmobiliario Bahiense</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon size={16} />
            {label}
            {badge != null && badge > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100" />)}
            </div>
          ) : stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Building2} label="Propiedades activas" value={stats.totalProperties} color="bg-primary-600" />
              <StatCard icon={Building2} label="Inmobiliarias" value={stats.totalAgencies} color="bg-indigo-500" />
              <StatCard icon={Users} label="Particulares" value={stats.totalParticulars} color="bg-purple-500" />
              <StatCard icon={Clock} label="Pendientes de verificación" value={stats.pendingVerifications} color="bg-yellow-500" />
            </div>
          )}

          {stats && stats.pendingVerifications > 0 && (
            <div className="card p-5 border-l-4 border-yellow-400 bg-yellow-50">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-yellow-600" />
                <p className="font-medium text-yellow-800">
                  Tenés {stats.pendingVerifications} solicitud{stats.pendingVerifications > 1 ? 'es' : ''} pendiente{stats.pendingVerifications > 1 ? 's' : ''} de verificación
                </p>
              </div>
              <div className="flex gap-2 mt-3">
                {pendingAgencies.length > 0 && (
                  <button onClick={() => setTab('agencies')} className="btn-secondary text-sm py-1.5">
                    Ver inmobiliarias ({pendingAgencies.length})
                  </button>
                )}
                {pendingParticulars.length > 0 && (
                  <button onClick={() => setTab('particulars')} className="btn-secondary text-sm py-1.5">
                    Ver particulares ({pendingParticulars.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {stats && stats.pendingVerifications === 0 && (
            <div className="card p-8 text-center text-gray-400">
              <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
              <p className="font-medium">No hay solicitudes pendientes</p>
              <p className="text-sm mt-1">Todas las cuentas están verificadas</p>
            </div>
          )}
        </div>
      )}

      {/* Inmobiliarias pendientes */}
      {tab === 'agencies' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} className="text-gray-500" />
            <p className="text-gray-600 text-sm">
              {pendingAgencies.length === 0
                ? 'No hay inmobiliarias pendientes'
                : `${pendingAgencies.length} inmobiliaria${pendingAgencies.length > 1 ? 's' : ''} pendiente${pendingAgencies.length > 1 ? 's' : ''} de verificación`
              }
            </p>
          </div>
          {pendingAgencies.length === 0 ? (
            <div className="card p-10 text-center text-gray-400">
              <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
              <p>Todas las inmobiliarias están verificadas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingAgencies.map((agency: PendingAgency) => (
                <VerifyCard
                  key={agency.id}
                  name={agency.name}
                  email={agency.user.email}
                  phone={agency.phone}
                  city={agency.city}
                  extra={agency.licenseNumber}
                  createdAt={agency.user.createdAt}
                  isProcessing={processing === agency.id}
                  onViewDocs={() => setDocModal({ type: 'agency', id: agency.id, name: agency.name })}
                  onApprove={() => handleVerifyAgency(agency.id, 'APPROVED')}
                  onReject={(reason) => handleVerifyAgency(agency.id, 'REJECTED', reason)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Particulares pendientes */}
      {tab === 'particulars' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} className="text-gray-500" />
            <p className="text-gray-600 text-sm">
              {pendingParticulars.length === 0
                ? 'No hay particulares pendientes'
                : `${pendingParticulars.length} particular${pendingParticulars.length > 1 ? 'es' : ''} pendiente${pendingParticulars.length > 1 ? 's' : ''} de verificación`
              }
            </p>
          </div>
          {pendingParticulars.length === 0 ? (
            <div className="card p-10 text-center text-gray-400">
              <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
              <p>Todos los particulares están verificados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingParticulars.map((p: PendingParticular) => (
                <VerifyCard
                  key={p.id}
                  name={`${p.firstName} ${p.lastName}`}
                  email={p.user.email}
                  phone={p.phone}
                  city={p.city}
                  createdAt={p.user.createdAt}
                  isProcessing={processing === p.id}
                  onViewDocs={() => setDocModal({ type: 'particular', id: p.id, name: `${p.firstName} ${p.lastName}` })}
                  onApprove={() => handleVerifyParticular(p.id, 'APPROVED')}
                  onReject={(reason) => handleVerifyParticular(p.id, 'REJECTED', reason)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Usuarios — suspensión */}
      {tab === 'users' && (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm flex items-center gap-2">
            <UserX size={16} />
            Gestioná el acceso de inmobiliarias y particulares
          </p>
          {loadingUsers ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="card p-5 h-20 animate-pulse bg-gray-100" />)}
            </div>
          ) : allUsers?.length === 0 ? (
            <div className="card p-10 text-center text-gray-400">
              <Users size={40} className="mx-auto mb-3" />
              <p>No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allUsers?.map(u => {
                const name = u.agency?.name ?? `${u.particular?.firstName} ${u.particular?.lastName}`
                const phone = u.agency?.phone ?? u.particular?.phone ?? ''
                const city = u.agency?.city ?? u.particular?.city ?? ''
                const isVerified = u.agency?.isVerified ?? u.particular?.isVerified ?? false
                return (
                  <div
                    key={u.id}
                    onClick={() => setUserModal(u)}
                    className={`card p-5 space-y-2 cursor-pointer hover:shadow-md transition-shadow ${
                      u.isSuspended ? 'border-red-200 bg-red-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{name}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                        <p className="text-sm text-gray-500">{phone} · {city}</p>
                        {u.lastLoginLocation && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin size={11} />
                            {u.lastLoginLocation}
                            {u.lastLoginAt && (
                              <span className="ml-1">· {new Date(u.lastLoginAt).toLocaleDateString('es-AR')}</span>
                            )}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.role === 'AGENCY' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {u.role === 'AGENCY' ? 'Inmobiliaria' : 'Particular'}
                          </span>
                          {isVerified ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Verificado</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Pendiente</span>
                          )}
                          {u.isSuspended && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Suspendido</span>
                          )}
                        </div>
                      </div>
                      <Eye size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Configuración — credenciales admin */}
      {tab === 'settings' && (
        <div className="max-w-md space-y-6">
          <p className="text-gray-600 text-sm flex items-center gap-2">
            <Settings size={16} />
            Cambiá tu email o contraseña de administrador
          </p>
          <form onSubmit={handleCredentials} className="card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual <span className="text-red-500">*</span></label>
              <input
                type="password"
                className="input-field"
                value={credForm.currentPassword}
                onChange={e => setCredForm(f => ({ ...f, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo email <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input
                type="email"
                className="input-field"
                placeholder="nuevo@email.com"
                value={credForm.newEmail}
                onChange={e => setCredForm(f => ({ ...f, newEmail: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input
                type="password"
                className="input-field"
                placeholder="Mín. 8 caracteres, mayúscula, número y símbolo"
                value={credForm.newPassword}
                onChange={e => setCredForm(f => ({ ...f, newPassword: e.target.value }))}
              />
            </div>
            {credMsg && (
              <p className={`text-sm p-3 rounded-lg ${
                credMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
              }`}>{credMsg.text}</p>
            )}
            <button
              type="submit"
              disabled={credLoading || !credForm.currentPassword || (!credForm.newEmail && !credForm.newPassword)}
              className="btn-primary w-full disabled:opacity-50"
            >
              {credLoading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      )}

      {/* Modal detalle de usuario */}
      {userModal && (() => {
        const u = userModal
        const name = u.agency?.name ?? `${u.particular?.firstName} ${u.particular?.lastName}`
        const phone = u.agency?.phone ?? u.particular?.phone ?? ''
        const city = u.agency?.city ?? u.particular?.city ?? ''
        const isVerified = u.agency?.isVerified ?? u.particular?.isVerified ?? false
        const profileId = u.agency?.id ?? u.particular?.id ?? ''
        const docType = u.role === 'AGENCY' ? 'agency' : 'particular'
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setUserModal(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">{name}</h3>
                <button onClick={() => setUserModal(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={22} />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-900">{u.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Teléfono</span>
                  <span className="font-medium text-gray-900">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ciudad</span>
                  <span className="font-medium text-gray-900">{city}</span>
                </div>
                {u.agency?.licenseNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Matrícula</span>
                    <span className="font-medium text-gray-900">{u.agency.licenseNumber}</span>
                  </div>
                )}
                {u.agency?.address && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dirección</span>
                    <span className="font-medium text-gray-900">{u.agency.address}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Registrado</span>
                  <span className="font-medium text-gray-900">{new Date(u.createdAt).toLocaleDateString('es-AR')}</span>
                </div>
                {u.lastLoginLocation && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Último acceso desde</span>
                    <span className="font-medium text-gray-900 flex items-center gap-1">
                      <MapPin size={12} className="text-gray-400" />
                      {u.lastLoginLocation}
                      {u.lastLoginAt && (
                        <span className="text-gray-400 font-normal ml-1">
                          · {new Date(u.lastLoginAt).toLocaleDateString('es-AR')}
                        </span>
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Estado</span>
                  <div className="flex gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.role === 'AGENCY' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                    }`}>{u.role === 'AGENCY' ? 'Inmobiliaria' : 'Particular'}</span>
                    {isVerified
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Verificado</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Pendiente</span>
                    }
                    {u.isSuspended && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Suspendido</span>}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => { setUserModal(null); setDocModal({ type: docType, id: profileId, name }) }}
                  className="flex items-center justify-center gap-2 btn-secondary text-sm py-2"
                >
                  <Eye size={15} /> Ver documentos
                </button>
                <button
                  onClick={async () => {
                    await handleToggleSuspend(u.id)
                    setUserModal(prev => prev ? { ...prev, isSuspended: !prev.isSuspended } : null)
                  }}
                  disabled={processing === u.id}
                  className={`flex items-center justify-center gap-2 text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 ${
                    u.isSuspended
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {u.isSuspended
                    ? <><UserCheck size={15} /> Reactivar cuenta</>
                    : <><UserX size={15} /> Suspender cuenta</>
                  }
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal de documentos */}
      {docModal && (
        <DocumentModal
          type={docModal.type}
          id={docModal.id}
          name={docModal.name}
          onClose={() => setDocModal(null)}
        />
      )}
    </div>
  )
}
