import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import https from 'https'
import crypto from 'crypto'
import {
  hashPassword, comparePassword, hashToken,
  signAccessToken, signRefreshToken, verifyRefreshToken,
  cookieOptions, refreshCookieOptions,
} from '../utils/security'
import { uploadImage } from '../config/cloudinary'
import { sendWelcomeEmail, sendPasswordResetEmail } from '../config/mailer'
import { AuthRequest } from '../middleware/auth.middleware'

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000

const httpGet = (url: string, headers: Record<string, string> = {}): Promise<string> =>
  new Promise((resolve, reject) => {
    const req = https.get(url, { headers, timeout: 4000 }, (res) => {
      let data = ''
      res.on('data', (chunk: string) => { data += chunk })
      res.on('end', () => resolve(data))
    })
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    req.on('error', reject)
  })

const getLocationFromCoords = async (lat: number, lon: number): Promise<string> => {
  try {
    const data = await httpGet(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`,
      { 'User-Agent': 'PIB-Portal/1.0 (portalinmobiliario.bahiablanca@gmail.com)' }
    )
    const geo = JSON.parse(data) as { address?: { city?: string; town?: string; village?: string; state?: string; country?: string } }
    const a = geo.address ?? {}
    const locality = a.city ?? a.town ?? a.village
    const result = [locality, a.state, a.country].filter(Boolean).join(', ')
    if (result) return result
  } catch { /* fallback */ }
  return ''
}

const getLocationFromIp = async (ip: string): Promise<string> => {
  try {
    const cleanIp = ip.replace('::ffff:', '').trim()
    if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp === '::1') return ''
    const data = await httpGet(`https://ipinfo.io/${cleanIp}/json`)
    const geo = JSON.parse(data) as { city?: string; region?: string; country?: string; bogon?: boolean }
    if (geo.bogon) return ''
    return [geo.city, geo.region, geo.country].filter(Boolean).join(', ')
  } catch { return '' }
}

export const registerAgency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone, address, city, licenseNumber } = req.body
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }

    if (!files?.dniFront?.[0] || !files?.dniBack?.[0] || !files?.selfie?.[0]) {
      res.status(400).json({ error: 'Se requieren fotos del DNI (frente, dorso) y selfie' })
      return
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      // Respuesta genérica para no revelar si el email existe
      res.status(409).json({ error: 'No se pudo completar el registro. Verificá los datos ingresados.' })
      return
    }

    const [dniFrontResult, dniBackResult, selfieResult] = await Promise.all([
      uploadImage(files.dniFront[0].buffer, 'pib/documents', true),
      uploadImage(files.dniBack[0].buffer, 'pib/documents', true),
      uploadImage(files.selfie[0].buffer, 'pib/documents', true),
    ])

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'AGENCY',
        agency: {
          create: {
            name, phone, address, city, licenseNumber,
            dniFrontUrl: dniFrontResult.publicId,
            dniBackUrl: dniBackResult.publicId,
            selfieUrl: selfieResult.publicId,
          },
        },
      },
    })

    await sendWelcomeEmail(email, name)

    res.status(201).json({
      message: 'Registro exitoso. Tu documentación está siendo revisada.',
      userId: user.id,
    })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const registerParticular = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone, city } = req.body
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }

    if (!files?.dniFront?.[0] || !files?.dniBack?.[0] || !files?.selfie?.[0]) {
      res.status(400).json({ error: 'Se requieren fotos del DNI (frente, dorso) y selfie' })
      return
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ error: 'No se pudo completar el registro. Verificá los datos ingresados.' })
      return
    }

    const [dniFrontResult, dniBackResult, selfieResult] = await Promise.all([
      uploadImage(files.dniFront[0].buffer, 'pib/documents', true),
      uploadImage(files.dniBack[0].buffer, 'pib/documents', true),
      uploadImage(files.selfie[0].buffer, 'pib/documents', true),
    ])

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'PARTICULAR',
        particular: {
          create: {
            firstName, lastName, phone, city,
            dniFrontUrl: dniFrontResult.publicId,
            dniBackUrl: dniBackResult.publicId,
            selfieUrl: selfieResult.publicId,
          },
        },
      },
    })

    await sendWelcomeEmail(email, `${firstName} ${lastName}`)

    res.status(201).json({
      message: 'Registro exitoso. Tu documentación está siendo revisada.',
      userId: user.id,
    })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, coords } = req.body as { email: string; password: string; coords?: { lat: number; lon: number } }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { agency: true, particular: true },
    })

    // Respuesta genérica para no revelar si el email existe
    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas' })
      return
    }

    // Verificar bloqueo por intentos fallidos
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      res.status(429).json({ error: `Cuenta bloqueada. Intentá en ${minutesLeft} minutos.` })
      return
    }

    const isValid = await comparePassword(password, user.passwordHash)

    if (!isValid) {
      const attempts = user.loginAttempts + 1
      const updateData: { loginAttempts: number; lockedUntil?: Date } = { loginAttempts: attempts }

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS)
      }

      await prisma.user.update({ where: { id: user.id }, data: updateData })
      res.status(401).json({ error: 'Credenciales inválidas' })
      return
    }

    // Verificar suspensión
    if (user.isSuspended) {
      res.status(403).json({ error: 'ACCOUNT_SUSPENDED' })
      return
    }

    // Verificar que esté aprobado (excepto admin)
    if (user.role !== 'ADMIN') {
      const profile = user.agency || user.particular
      if (!profile?.isVerified) {
        res.status(403).json({ error: 'Tu cuenta está pendiente de verificación' })
        return
      }
    }

    // Reset intentos fallidos
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    })

    // Guardar ubicación en segundo plano (no bloquea la respuesta)
    void (async () => {
      try {
        let location = ''
        if (coords?.lat && coords?.lon) {
          location = await getLocationFromCoords(coords.lat, coords.lon)
        }
        if (!location) {
          const forwarded = req.headers['x-forwarded-for'] as string
          const realIp = req.headers['x-real-ip'] as string
          const socketIp = req.socket.remoteAddress || ''
          const ip = forwarded?.split(',')[0]?.trim() || realIp || socketIp
          location = await getLocationFromIp(ip)
        }
        if (location) {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginLocation: location },
          })
        }
        // Limpiar tokens expirados o revocados del usuario (máximo cada login)
        await prisma.refreshToken.deleteMany({
          where: {
            userId: user.id,
            OR: [{ revoked: true }, { expiresAt: { lt: new Date() } }],
          },
        })
      } catch { /* silencioso */ }
    })()

    const tokenPayload = { userId: user.id, role: user.role }
    const accessToken = signAccessToken(tokenPayload)
    const refreshToken = signRefreshToken(tokenPayload)

    // Guardar hash del refresh token
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    res.cookie('refreshToken', refreshToken, refreshCookieOptions)

    const profile = user.agency || user.particular
    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.agency?.name ?? `${user.particular?.firstName} ${user.particular?.lastName}`,
        isVerified: profile?.isVerified ?? false,
        isSuspended: user.isSuspended,
      },
    })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const refreshTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken

    if (!token) {
      res.status(401).json({ error: 'Refresh token requerido' })
      return
    }

    const payload = verifyRefreshToken(token)
    const tokenHash = hashToken(token)

    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } })

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      res.clearCookie('refreshToken', cookieOptions)
      res.status(401).json({ error: 'Refresh token inválido' })
      return
    }

    // Rotation: revocar el actual y crear uno nuevo
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } })

    const newAccessToken = signAccessToken({ userId: payload.userId, role: payload.role })
    const newRefreshToken = signRefreshToken({ userId: payload.userId, role: payload.role })

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(newRefreshToken),
        userId: payload.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions)
    res.json({ accessToken: newAccessToken })
  } catch {
    res.status(401).json({ error: 'Refresh token inválido o expirado' })
  }
}

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken

    if (token) {
      const tokenHash = hashToken(token)
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      })
    }

    res.clearCookie('refreshToken', cookieOptions)
    res.json({ message: 'Sesión cerrada correctamente' })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email: string }

    // Respuesta genérica siempre para no revelar si el email existe
    const genericResponse = { message: 'Si el email existe, recibirás un link para restablecer tu contraseña.' }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) { res.json(genericResponse); return }

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
      },
    })

    const resetUrl = `${process.env['FRONTEND_URL']}/reset-password?token=${token}`
    await sendPasswordResetEmail(email, resetUrl)

    res.json(genericResponse)
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body as { token: string; password: string }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { gt: new Date() },
      },
    })

    if (!user) {
      res.status(400).json({ error: 'El link es inválido o ya expiró. Solicitá uno nuevo.' })
      return
    }

    const passwordHash = await hashPassword(password)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        loginAttempts: 0,
        lockedUntil: null,
      },
    })

    // Revocar todos los refresh tokens activos
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revoked: false },
      data: { revoked: true },
    })

    res.json({ message: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.' })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
