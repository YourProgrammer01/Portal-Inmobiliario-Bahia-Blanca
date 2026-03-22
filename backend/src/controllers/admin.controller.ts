import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { getPrivateImageUrl } from '../config/cloudinary'
import { sendVerificationApproved, sendVerificationRejected } from '../config/mailer'

export const getPendingUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [agencies, particulars] = await Promise.all([
      prisma.agency.findMany({
        where: { verificationStatus: 'PENDING' },
        include: { user: { select: { email: true, createdAt: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.particular.findMany({
        where: { verificationStatus: 'PENDING' },
        include: { user: { select: { email: true, createdAt: true } } },
        orderBy: { createdAt: 'asc' },
      }),
    ])
    res.json({ agencies, particulars })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getDocumentUrls = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = req.params['type'] as string
    const id = req.params['id'] as string
    let profile: { dniFrontUrl: string; dniBackUrl: string; selfieUrl: string } | null = null

    if (type === 'agency') {
      profile = await prisma.agency.findUnique({ where: { id } })
    } else if (type === 'particular') {
      profile = await prisma.particular.findUnique({ where: { id } })
    }

    if (!profile) { res.status(404).json({ error: 'Perfil no encontrado' }); return }

    res.json({
      dniFront: getPrivateImageUrl(profile.dniFrontUrl),
      dniBack: getPrivateImageUrl(profile.dniBackUrl),
      selfie: getPrivateImageUrl(profile.selfieUrl),
    })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const verifyAgency = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string
    const { status, rejectionReason } = req.body as { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }

    const agency = await prisma.agency.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    })

    if (!agency) { res.status(404).json({ error: 'Inmobiliaria no encontrada' }); return }

    const isApproved = status === 'APPROVED'

    await prisma.agency.update({
      where: { id },
      data: {
        verificationStatus: status,
        isVerified: isApproved,
        rejectionReason: isApproved ? null : (rejectionReason ?? null),
      },
    })

    if (isApproved) {
      await sendVerificationApproved(agency.user.email, agency.name)
    } else {
      await sendVerificationRejected(agency.user.email, agency.name, rejectionReason ?? 'Sin motivo especificado')
    }

    res.json({ message: `Inmobiliaria ${isApproved ? 'aprobada' : 'rechazada'} correctamente` })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const verifyParticular = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string
    const { status, rejectionReason } = req.body as { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }

    const particular = await prisma.particular.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    })

    if (!particular) { res.status(404).json({ error: 'Usuario no encontrado' }); return }

    const isApproved = status === 'APPROVED'

    await prisma.particular.update({
      where: { id },
      data: {
        verificationStatus: status,
        isVerified: isApproved,
        rejectionReason: isApproved ? null : (rejectionReason ?? null),
      },
    })

    const name = `${particular.firstName} ${particular.lastName}`
    if (isApproved) {
      await sendVerificationApproved(particular.user.email, name)
    } else {
      await sendVerificationRejected(particular.user.email, name, rejectionReason ?? 'Sin motivo especificado')
    }

    res.json({ message: `Usuario ${isApproved ? 'aprobado' : 'rechazado'} correctamente` })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalProperties, totalAgencies, totalParticulars, pendingAgencies, pendingParticulars] =
      await Promise.all([
        prisma.property.count({ where: { status: 'ACTIVE' } }),
        prisma.agency.count({ where: { isVerified: true } }),
        prisma.particular.count({ where: { isVerified: true } }),
        prisma.agency.count({ where: { verificationStatus: 'PENDING' } }),
        prisma.particular.count({ where: { verificationStatus: 'PENDING' } }),
      ])

    res.json({
      totalProperties,
      totalAgencies,
      totalParticulars,
      pendingVerifications: pendingAgencies + pendingParticulars,
    })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
