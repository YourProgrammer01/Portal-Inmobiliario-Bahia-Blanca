import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.middleware'
import { prisma } from '../config/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { Response } from 'express'

const router = Router()

router.get('/profile', authenticate, requireRole('PARTICULAR'), async (req: AuthRequest, res: Response) => {
  try {
    const particular = await prisma.particular.findUnique({
      where: { userId: req.user!.userId },
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        city: true, verificationStatus: true, isVerified: true, createdAt: true,
      },
    })
    if (!particular) { res.status(404).json({ error: 'Perfil no encontrado' }); return }
    res.json(particular)
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router
