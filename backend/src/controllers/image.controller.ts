import { Response } from 'express'
import { prisma } from '../config/prisma'
import { uploadImage, deleteImage } from '../config/cloudinary'
import { AuthRequest } from '../middleware/auth.middleware'

const ROOM_LABELS: Record<string, string> = {
  exterior: 'Frente / Exterior',
  living: 'Living / Comedor',
  kitchen: 'Cocina',
  bedroom: 'Dormitorio',
  bathroom: 'Baño',
  garage: 'Garage / Cochera',
  garden: 'Jardín / Patio / Terraza',
  other: 'Otros',
}

const getOwnerUserId = async (propertyId: string) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      agency: { select: { userId: true } },
      particular: { select: { userId: true } },
    },
  })
  return {
    property,
    ownerUserId: property?.agency?.userId ?? property?.particular?.userId,
  }
}

export const addPropertyImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string
    const userId = req.user!.userId
    const files = req.files as Express.Multer.File[]

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'Se requiere al menos una imagen' })
      return
    }

    const { property, ownerUserId } = await getOwnerUserId(id)
    if (!property) { res.status(404).json({ error: 'Propiedad no encontrada' }); return }
    if (ownerUserId !== userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Sin permiso' }); return
    }

    const lastImage = await prisma.propertyImage.findFirst({
      where: { propertyId: id },
      orderBy: { order: 'desc' },
    })
    const startOrder = (lastImage?.order ?? -1) + 1

    const imageUploads = await Promise.all(
      files.map(async (file, index) => {
        const room = file.fieldname.split('_')[0] ?? 'other'
        const result = await uploadImage(file.buffer, 'pib/properties')
        return {
          propertyId: id,
          url: result.url,
          publicId: result.publicId,
          room: ROOM_LABELS[room] ?? 'Otros',
          order: startOrder + index,
        }
      })
    )

    const images = await prisma.propertyImage.createMany({ data: imageUploads })
    const allImages = await prisma.propertyImage.findMany({
      where: { propertyId: id },
      orderBy: { order: 'asc' },
    })

    res.status(201).json({ added: images.count, images: allImages })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deletePropertyImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string
    const imageId = req.params['imageId'] as string
    const userId = req.user!.userId

    const image = await prisma.propertyImage.findUnique({
      where: { id: imageId },
      include: {
        property: {
          include: {
            agency: { select: { userId: true } },
            particular: { select: { userId: true } },
          },
        },
      },
    })

    if (!image || image.propertyId !== id) {
      res.status(404).json({ error: 'Imagen no encontrada' }); return
    }

    const ownerUserId = image.property.agency?.userId ?? image.property.particular?.userId
    if (ownerUserId !== userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Sin permiso' }); return
    }

    await deleteImage(image.publicId)
    await prisma.propertyImage.delete({ where: { id: imageId } })

    res.json({ message: 'Imagen eliminada correctamente' })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
