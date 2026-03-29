import { Request, Response } from 'express'
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

export const getProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string>
    const pageNum = parseInt(q['page'] ?? '1')
    const limitNum = parseInt(q['limit'] ?? '12')
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = { status: 'ACTIVE' }
    if (q['city']) where['city'] = { contains: q['city'], mode: 'insensitive' }
    if (q['operationType']) where['operationType'] = q['operationType']
    if (q['propertyType']) where['propertyType'] = q['propertyType']
    if (q['neighborhood']) where['neighborhood'] = { contains: q['neighborhood'], mode: 'insensitive' }
    if (q['publisherType']) where['publisherType'] = q['publisherType']
    if (q['minPrice'] || q['maxPrice']) {
      const price: Record<string, number> = {}
      if (q['minPrice']) price['gte'] = parseFloat(q['minPrice'])
      if (q['maxPrice']) price['lte'] = parseFloat(q['maxPrice'])
      where['price'] = price
    }
    if (q['bedrooms']) where['bedrooms'] = { gte: parseInt(q['bedrooms']) }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { select: { id: true, url: true, room: true, order: true }, orderBy: { order: 'asc' } },
          agency: { select: { name: true, phone: true, logoUrl: true } },
          particular: { select: { firstName: true, lastName: true, phone: true } },
        },
      }),
      prisma.property.count({ where }),
    ])

    res.json({
      data: properties,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getPropertyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string
    const property = await prisma.property.findUnique({
      where: { id, status: 'ACTIVE' },
      include: {
        images: { select: { id: true, url: true, room: true, order: true }, orderBy: { order: 'asc' } },
        agency: { select: { name: true, phone: true, logoUrl: true, city: true } },
        particular: { select: { firstName: true, lastName: true, phone: true } },
      },
    })
    if (!property) { res.status(404).json({ error: 'Propiedad no encontrada' }); return }
    res.json(property)
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const createProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'Se requieren imágenes de la propiedad' })
      return
    }

    const userId = req.user!.userId
    const role = req.user!.role

    let agencyId: string | undefined
    let particularId: string | undefined
    let publisherType: 'AGENCY' | 'PARTICULAR'

    if (role === 'AGENCY') {
      const agency = await prisma.agency.findUnique({ where: { userId } })
      if (!agency?.isVerified) { res.status(403).json({ error: 'Tu cuenta no está verificada' }); return }
      agencyId = agency.id
      publisherType = 'AGENCY'
    } else {
      const particular = await prisma.particular.findUnique({ where: { userId } })
      if (!particular?.isVerified) { res.status(403).json({ error: 'Tu cuenta no está verificada' }); return }
      particularId = particular.id
      publisherType = 'PARTICULAR'
    }

    const imageUploads = await Promise.all(
      files.map(async (file, index) => {
        const room = file.fieldname.split('_')[0] ?? 'other'
        const result = await uploadImage(file.buffer, 'pib/properties')
        return { url: result.url, publicId: result.publicId, room: ROOM_LABELS[room] ?? 'Otros', order: index }
      })
    )

    const body = req.body as Record<string, string>

    const property = await prisma.property.create({
      data: {
        title: body['title'],
        description: body['description'],
        price: parseFloat(body['price']),
        currency: body['currency'] ?? 'ARS',
        operationType: body['operationType'] as 'SALE' | 'RENT',
        propertyType: body['propertyType'] as 'HOUSE' | 'APARTMENT' | 'LAND' | 'COMMERCIAL' | 'OFFICE',
        city: body['city'],
        neighborhood: body['neighborhood'] || undefined,
        address: body['address'],
        bedrooms: body['bedrooms'] ? parseInt(body['bedrooms']) : undefined,
        bathrooms: body['bathrooms'] ? parseInt(body['bathrooms']) : undefined,
        squareMeters: body['squareMeters'] ? parseFloat(body['squareMeters']) : undefined,
        coveredMeters: body['coveredMeters'] ? parseFloat(body['coveredMeters']) : undefined,
        garages: body['garages'] ? parseInt(body['garages']) : undefined,
        contactPhone: body['contactPhone'],
        publisherType,
        agencyId,
        particularId,
        images: { create: imageUploads },
      },
      include: { images: true },
    })

    res.status(201).json(property)
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const updateProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string
    const userId = req.user!.userId

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        agency: { select: { userId: true } },
        particular: { select: { userId: true } },
      },
    })

    if (!property) { res.status(404).json({ error: 'Propiedad no encontrada' }); return }

    const isOwner = property.agency?.userId === userId || property.particular?.userId === userId
    if (!isOwner) { res.status(403).json({ error: 'No tenés permiso para editar esta propiedad' }); return }

    const updated = await prisma.property.update({
      where: { id },
      data: req.body as Record<string, unknown>,
      include: { images: { orderBy: { order: 'asc' } } },
    })

    res.json(updated)
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string
    const userId = req.user!.userId
    const role = req.user!.role

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: true,
        agency: { select: { userId: true } },
        particular: { select: { userId: true } },
      },
    })

    if (!property) { res.status(404).json({ error: 'Propiedad no encontrada' }); return }

    const isOwner = property.agency?.userId === userId || property.particular?.userId === userId
    if (!isOwner && role !== 'ADMIN') {
      res.status(403).json({ error: 'No tenés permiso para eliminar esta propiedad' })
      return
    }

    await Promise.all(property.images.map((img: { publicId: string }) => deleteImage(img.publicId)))
    await prisma.property.delete({ where: { id } })

    res.json({ message: 'Propiedad eliminada correctamente' })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getMyProperties = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const role = req.user!.role

    const where = role === 'AGENCY'
      ? { agency: { userId } }
      : { particular: { userId } }

    const properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { order: 'asc' }, take: 1 } },
    })

    res.json(properties)
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
