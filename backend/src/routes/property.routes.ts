import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { uploadPropertyImages, handleMulterError } from '../middleware/upload.middleware'
import { createPropertySchema, updatePropertySchema, propertyFiltersSchema } from '../utils/validators'
import {
  getProperties, getPropertyById, createProperty,
  updateProperty, deleteProperty, getMyProperties,
} from '../controllers/property.controller'

const router = Router()

router.get('/', validate(propertyFiltersSchema, 'query'), getProperties)
router.get('/my', authenticate, requireRole('AGENCY', 'PARTICULAR'), getMyProperties)
router.get('/:id', getPropertyById)

router.post(
  '/',
  authenticate,
  requireRole('AGENCY', 'PARTICULAR'),
  uploadPropertyImages.any(),
  handleMulterError,
  validate(createPropertySchema),
  createProperty
)

router.patch(
  '/:id',
  authenticate,
  requireRole('AGENCY', 'PARTICULAR'),
  validate(updatePropertySchema),
  updateProperty
)

router.delete('/:id', authenticate, requireRole('AGENCY', 'PARTICULAR', 'ADMIN'), deleteProperty)

export default router
