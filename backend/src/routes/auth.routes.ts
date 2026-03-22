import { Router } from 'express'
import { uploadDocuments, handleMulterError } from '../middleware/upload.middleware'
import { validate } from '../middleware/validate.middleware'
import { authenticate } from '../middleware/auth.middleware'
import {
  registerAgencySchema, registerParticularSchema, loginSchema,
} from '../utils/validators'
import {
  registerAgency, registerParticular, login, refreshTokens, logout,
} from '../controllers/auth.controller'

const router = Router()

router.post(
  '/register/agency',
  uploadDocuments.fields([
    { name: 'dniFront', maxCount: 1 },
    { name: 'dniBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  handleMulterError,
  validate(registerAgencySchema),
  registerAgency
)

router.post(
  '/register/particular',
  uploadDocuments.fields([
    { name: 'dniFront', maxCount: 1 },
    { name: 'dniBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  handleMulterError,
  validate(registerParticularSchema),
  registerParticular
)

router.post('/login', validate(loginSchema), login)
router.post('/refresh', refreshTokens)
router.post('/logout', authenticate, logout)

export default router
