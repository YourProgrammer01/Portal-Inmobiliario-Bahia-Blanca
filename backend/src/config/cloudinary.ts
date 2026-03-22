import { v2 as cloudinary } from 'cloudinary'
import { config } from '../config/env'
import { v4 as uuidv4 } from 'uuid'

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
})

export const uploadImage = async (
  buffer: Buffer,
  folder: string,
  isPrivate = false
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const publicId = `${folder}/${uuidv4()}`
    const uploadOptions = {
      public_id: publicId,
      folder,
      resource_type: 'image' as const,
      type: isPrivate ? 'private' : 'upload',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    }

    cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error || !result) return reject(error || new Error('Upload fallido'))
      resolve({ url: result.secure_url, publicId: result.public_id })
    }).end(buffer)
  })
}

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId)
}

export const getPrivateImageUrl = (publicId: string): string =>
  cloudinary.url(publicId, { sign_url: true, type: 'private', secure: true })
