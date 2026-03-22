import multer from 'multer'
import { Request, Response, NextFunction } from 'express'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DOC_SIZE = 2 * 1024 * 1024  // 2MB

const storage = multer.memoryStorage()

const imageFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'))
  }
}

export const uploadPropertyImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 30 },
})

export const uploadDocuments = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_DOC_SIZE, files: 3 },
})

export const handleMulterError = (err: unknown, _req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'El archivo supera el tamaño máximo permitido' })
      return
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({ error: 'Se superó el límite de archivos' })
      return
    }
    res.status(400).json({ error: err.message })
    return
  }
  if (err instanceof Error) {
    res.status(400).json({ error: err.message })
    return
  }
  next(err)
}
