import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { config } from './config/env'
import authRoutes from './routes/auth.routes'
import propertyRoutes from './routes/property.routes'
import agencyRoutes from './routes/agency.routes'
import particularRoutes from './routes/particular.routes'
import adminRoutes from './routes/admin.routes'

const app = express()
app.set('trust proxy', 1)

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}))

// CORS estricto
const allowedOrigins = [
  config.frontendUrl,
  'https://project-vd92w.vercel.app',
]
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true)
    else callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intentá más tarde.' },
})

// Rate limiting estricto para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, intentá en 15 minutos.' },
})

app.use(globalLimiter)
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())

// Routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/agencies', agencyRoutes)
app.use('/api/particulars', particularRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'PIB API' }))

// 404
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

app.listen(config.port, () => {
  console.log(`PIB API corriendo en puerto ${config.port} [${config.nodeEnv}]`)
})

export default app
