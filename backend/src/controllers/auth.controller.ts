import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import https from 'https'
import {
  hashPassword, comparePassword, hashToken,
  signAccessToken, signRefreshToken, verifyRefreshToken,
  cookieOptions, refreshCookieOptions,
} from '../utils/security'
import { uploadImage } from '../config/cloudinary'
import { sendWelcomeEmail } from '../config/mailer'
import { AuthRequest } from '../middleware/auth.middleware'

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000

const reverseGeocode = (lat: number, lon: number): Promise<string> =>
  new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`
    https.get(url, { headers: { 'User-Agent': 'PIB-Portal/1.0' } }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const geo = JSON.parse(data) as { address?: { city?: string; town?: string; village?: string; state?: string; country?: string } }
          const a = geo.address ?? {}
          const locality = a.city ?? a.town ?? a.village
          resolve([locality, a.state, a.country].filter(Boolean).join(', '))
        } catch { resolve('') }
      })
    }).on('error', () => resolve(''))
  })

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
      res.status(409).json({ error: 'El email ya está registrado' })
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
      res.status(409).json({ error: 'El email ya está registrado' })
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

    // Reset intentos fallidos + guardar ubicación
    let location: string | undefined
    if (coords?.lat && coords?.lon) {
      location = await reverseGeocode(coords.lat, coords.lon)
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        ...(location ? { lastLoginLocation: location, lastLoginAt: new Date() } : { lastLoginAt: new Date() }),
      },
    })

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
