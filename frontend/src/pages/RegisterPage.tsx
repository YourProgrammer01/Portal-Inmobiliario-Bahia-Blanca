import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Building2, User, Upload, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { registerAgencyService, registerParticularService } from '../services/property.service'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
const phoneRegex = /^(\+54|0)?[1-9]\d{9,10}$/

const agencySchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().regex(passwordRegex, 'Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo'),
  name: z.string().min(2, 'Nombre requerido').max(100),
  phone: z.string().regex(phoneRegex, 'Teléfono inválido'),
  address: z.string().min(5, 'Dirección requerida'),
  city: z.string().min(2, 'Ciudad requerida'),
  licenseNumber: z.string().min(3, 'Matrícula requerida'),
})

const particularSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().regex(passwordRegex, 'Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo'),
  firstName: z.string().min(2, 'Nombre requerido'),
  lastName: z.string().min(2, 'Apellido requerido'),
  phone: z.string().regex(phoneRegex, 'Teléfono inválido'),
  city: z.string().min(2, 'Ciudad requerida'),
})

type AgencyForm = z.infer<typeof agencySchema>
type ParticularForm = z.infer<typeof particularSchema>

const FileInput = ({ label, name, onChange }: { label: string; name: string; onChange: (file: File | null) => void }) => {
  const [fileName, setFileName] = useState<string>('')
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary-400 rounded-lg p-3 transition-colors">
        <Upload size={16} className="text-gray-400" />
        <span className="text-sm text-gray-500 truncate">{fileName || 'Seleccionar archivo'}</span>
        <input
          type="file"
          name={name}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            setFileName(file?.name ?? '')
            onChange(file)
          }}
        />
      </label>
    </div>
  )
}

export const RegisterPage = () => {
  const [type, setType] = useState<'agency' | 'particular' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [docs, setDocs] = useState<{ dniFront?: File; dniBack?: File; selfie?: File }>({})
  const navigate = useNavigate()

  const agencyForm = useForm<AgencyForm>({ resolver: zodResolver(agencySchema), defaultValues: { city: 'Bahia Blanca' } })
  const particularForm = useForm<ParticularForm>({ resolver: zodResolver(particularSchema), defaultValues: { city: 'Bahia Blanca' } })

  const onSubmitAgency = async (data: AgencyForm) => {
    if (!docs.dniFront || !docs.dniBack || !docs.selfie) {
      setError('Debés subir el DNI (frente y dorso) y una selfie')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => formData.append(k, v))
      formData.append('dniFront', docs.dniFront)
      formData.append('dniBack', docs.dniBack)
      formData.append('selfie', docs.selfie)
      await registerAgencyService(formData)
      setSuccess(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Error al registrarse')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitParticular = async (data: ParticularForm) => {
    if (!docs.dniFront || !docs.dniBack || !docs.selfie) {
      setError('Debés subir el DNI (frente y dorso) y una selfie')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => formData.append(k, v))
      formData.append('dniFront', docs.dniFront)
      formData.append('dniBack', docs.dniBack)
      formData.append('selfie', docs.selfie)
      await registerParticularService(formData)
      setSuccess(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Error al registrarse')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro exitoso!</h2>
          <p className="text-gray-600 mb-6">
            Tu documentación está siendo revisada. Te notificaremos por email cuando tu cuenta sea aprobada.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary w-full">Volver al inicio</button>
        </div>
      </div>
    )
  }

  const docFields = (
    <div className="space-y-3 pt-2">
      <p className="text-sm font-semibold text-gray-700">Documentación de verificación</p>
      <FileInput label="DNI - Frente *" name="dniFront" onChange={(f) => setDocs(d => ({ ...d, dniFront: f ?? undefined }))} />
      <FileInput label="DNI - Dorso *" name="dniBack" onChange={(f) => setDocs(d => ({ ...d, dniBack: f ?? undefined }))} />
      <FileInput label="Selfie con DNI en mano *" name="selfie" onChange={(f) => setDocs(d => ({ ...d, selfie: f ?? undefined }))} />
      <p className="text-xs text-gray-400">Tus documentos son privados y solo los verá el equipo de PIB para verificar tu identidad.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="bg-primary-600 text-white font-bold text-2xl px-4 py-2 rounded-xl inline-block mb-3">PIB</div>
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">Publicá tus propiedades en el Portal Inmobiliario Bahiense</p>
        </div>

        {/* Selector de tipo */}
        {!type && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setType('agency')}
              className="card p-6 text-center hover:border-primary-400 hover:shadow-md transition-all border-2 border-transparent cursor-pointer"
            >
              <Building2 size={40} className="mx-auto mb-3 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Inmobiliaria</h3>
              <p className="text-xs text-gray-500 mt-1">Agencia o corredor inmobiliario</p>
            </button>
            <button
              onClick={() => setType('particular')}
              className="card p-6 text-center hover:border-primary-400 hover:shadow-md transition-all border-2 border-transparent cursor-pointer"
            >
              <User size={40} className="mx-auto mb-3 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Particular</h3>
              <p className="text-xs text-gray-500 mt-1">Propietario individual</p>
            </button>
          </div>
        )}

        {/* Formulario Inmobiliaria */}
        {type === 'agency' && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <button onClick={() => setType(null)} className="text-gray-400 hover:text-gray-600 text-sm">← Volver</button>
              <h2 className="font-semibold text-gray-900">Registro de Inmobiliaria</h2>
            </div>
            <form onSubmit={agencyForm.handleSubmit(onSubmitAgency)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la inmobiliaria *</label>
                  <input className="input-field" {...agencyForm.register('name')} />
                  {agencyForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{agencyForm.formState.errors.name.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" className="input-field" {...agencyForm.register('email')} />
                  {agencyForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{agencyForm.formState.errors.email.message}</p>}
                </div>
                <div className="col-span-2 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                  <input type={showPassword ? 'text' : 'password'} className="input-field pr-10" {...agencyForm.register('password')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {agencyForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{agencyForm.formState.errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                  <input className="input-field" placeholder="+54291..." {...agencyForm.register('phone')} />
                  {agencyForm.formState.errors.phone && <p className="text-red-500 text-xs mt-1">{agencyForm.formState.errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula *</label>
                  <input className="input-field" {...agencyForm.register('licenseNumber')} />
                  {agencyForm.formState.errors.licenseNumber && <p className="text-red-500 text-xs mt-1">{agencyForm.formState.errors.licenseNumber.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                  <input className="input-field" {...agencyForm.register('address')} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                  <input className="input-field" {...agencyForm.register('city')} />
                </div>
              </div>
              {docFields}
              {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
              <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
                {isLoading ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </form>
          </div>
        )}

        {/* Formulario Particular */}
        {type === 'particular' && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <button onClick={() => setType(null)} className="text-gray-400 hover:text-gray-600 text-sm">← Volver</button>
              <h2 className="font-semibold text-gray-900">Registro de Particular</h2>
            </div>
            <form onSubmit={particularForm.handleSubmit(onSubmitParticular)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input className="input-field" {...particularForm.register('firstName')} />
                  {particularForm.formState.errors.firstName && <p className="text-red-500 text-xs mt-1">{particularForm.formState.errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                  <input className="input-field" {...particularForm.register('lastName')} />
                  {particularForm.formState.errors.lastName && <p className="text-red-500 text-xs mt-1">{particularForm.formState.errors.lastName.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" className="input-field" {...particularForm.register('email')} />
                  {particularForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{particularForm.formState.errors.email.message}</p>}
                </div>
                <div className="col-span-2 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                  <input type={showPassword ? 'text' : 'password'} className="input-field pr-10" {...particularForm.register('password')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {particularForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{particularForm.formState.errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                  <input className="input-field" placeholder="+54291..." {...particularForm.register('phone')} />
                  {particularForm.formState.errors.phone && <p className="text-red-500 text-xs mt-1">{particularForm.formState.errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                  <input className="input-field" {...particularForm.register('city')} />
                </div>
              </div>
              {docFields}
              {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
              <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
                {isLoading ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tenés cuenta? <Link to="/login" className="text-primary-600 hover:underline font-medium">Ingresá</Link>
        </p>
      </div>
    </div>
  )
}
