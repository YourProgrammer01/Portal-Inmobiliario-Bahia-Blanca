import { AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const SuspendedPage = () => {
  const { logout } = useAuth()

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-red-100 p-5 rounded-full">
            <AlertTriangle size={48} className="text-red-600" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Cuenta suspendida</h1>
          <p className="text-gray-600 leading-relaxed">
            Tu cuenta se encuentra <span className="font-semibold text-red-600">suspendida por falta de pago</span>.
            Por favor, comunicate a la mayor brevedad con tu asesor a los fines de regularizar
            tu situación y poder continuar operando en el portal.
          </p>
        </div>

        <div className="card p-5 bg-red-50 border border-red-200 text-left space-y-2">
          <p className="text-sm font-semibold text-red-800">¿Qué hacer?</p>
          <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
            <li>Contactá a tu asesor de PIB</li>
            <li>Regularizá el pago pendiente</li>
            <li>Una vez regularizado, tu cuenta será reactivada automáticamente</li>
          </ul>
        </div>

        <button
          onClick={logout}
          className="btn-secondary w-full"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
