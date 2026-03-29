import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Eye, EyeOff, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const WA_NUMBER = '5492914648646'
const WA_MSG = encodeURIComponent('Hola, me comunico para regularizar la situación de mi cuenta en el Portal Inmobiliario Bahiense.')

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

type LoginForm = z.infer<typeof schema>

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError('')
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg === 'ACCOUNT_SUSPENDED' ? 'SUSPENDED' : (msg ?? 'Error al iniciar sesión'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="bg-primary-600 text-white font-bold text-2xl px-4 py-2 rounded-xl inline-block mb-3">PIB</div>
          <h1 className="text-xl font-bold text-gray-900">Ingresar</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input-field" {...register('email')} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type={showPassword ? 'text' : 'password'} className="input-field pr-10" {...register('password')} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {error && error !== 'SUSPENDED' && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          {error === 'SUSPENDED' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <p className="text-red-700 text-sm leading-relaxed">
                Su cuenta se encuentra <span className="font-semibold">suspendida por falta de pago</span>, por favor comuníquese con su asesor comercial a los fines de regularizar su situación y poder continuar operando.
              </p>
              <a
                href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <MessageCircle size={16} />
                Contactar asesor por WhatsApp
              </a>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </button>

          <p className="text-center text-sm text-gray-500">
            <Link to="/recuperar-password" className="text-primary-600 hover:underline">¿Olvidaste tu contraseña?</Link>
          </p>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿No tenés cuenta? <Link to="/registro" className="text-primary-600 hover:underline font-medium">Registrate</Link>
        </p>
      </div>
    </div>
  )
}
