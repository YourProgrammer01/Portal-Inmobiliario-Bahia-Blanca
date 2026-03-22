import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.middleware'
import { prisma } from '../config/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { Response } from 'express'

const router = Router()

router.get('/profile', authenticate, requireRole('AGENCY'), async (req: AuthRequest, res: Response) => {
  try {
    const agency = await prisma.agency.findUnique({
      where: { userId: req.user!.userId },
      select: {
        id: true, name: true, phone: true, address: true,
        city: true, logoUrl: true, licenseNumber: true,
        verificationStatus: true, isVerified: true, createdAt: true,
      },
    })
    if (!agency) { res.status(404).json({ error: 'Perfil no encontrado' }); return }
    res.json(agency)
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router
