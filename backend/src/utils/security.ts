import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { config } from '../config/env'

const SALT_ROUNDS = 12
const ALGORITHM = 'aes-256-cbc'

// --- Hashing ---
export const hashPassword = (password: string) => bcrypt.hash(password, SALT_ROUNDS)

export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash)

export const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex')

// --- JWT ---
export interface JwtPayload {
  userId: string
  role: string
  type: 'access' | 'refresh'
}

export const signAccessToken = (payload: Omit<JwtPayload, 'type'>) =>
  jwt.sign({ ...payload, type: 'access' }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires as jwt.SignOptions['expiresIn'],
  })

export const signRefreshToken = (payload: Omit<JwtPayload, 'type'>) =>
  jwt.sign({ ...payload, type: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires as jwt.SignOptions['expiresIn'],
  })

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, config.jwt.accessSecret) as JwtPayload

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, config.jwt.refreshSecret) as JwtPayload

// --- Encriptación AES-256 para datos sensibles ---
export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(config.encryptionKey), iv)
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

export const decrypt = (encryptedText: string): string => {
  const [ivHex, encryptedHex] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(config.encryptionKey), iv)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString()
}

// --- Cookies seguras ---
export const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict' as const,
  path: '/',
}

export const refreshCookieOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
}
