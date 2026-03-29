import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { verifyUserSchema, changeAdminCredentialsSchema } from '../utils/validators'
import {
  getPendingUsers, getDocumentUrls, verifyAgency,
  verifyParticular, getDashboardStats, getAllUsers, toggleSuspendUser,
  changeAdminCredentials,
} from '../controllers/admin.controller'

const router = Router()

router.use(authenticate, requireRole('ADMIN'))

router.get('/dashboard', getDashboardStats)
router.get('/pending', getPendingUsers)
router.get('/users', getAllUsers)
router.get('/documents/:type/:id', getDocumentUrls)
router.patch('/verify/agency/:id', validate(verifyUserSchema), verifyAgency)
router.patch('/verify/particular/:id', validate(verifyUserSchema), verifyParticular)
router.patch('/users/:id/suspend', toggleSuspendUser)
router.patch('/credentials', validate(changeAdminCredentialsSchema), changeAdminCredentials)

export default router
