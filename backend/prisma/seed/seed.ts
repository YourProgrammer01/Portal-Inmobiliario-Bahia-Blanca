import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] ?? 'admin@pib.com.ar'
const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] ?? 'Admin1234!'

async function main() {
  console.log('🌱 Iniciando seed...')

  // Admin — upsert para permitir actualizar credenciales
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
  const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { email: ADMIN_EMAIL, passwordHash },
    })
    console.log(`✅ Admin actualizado: ${ADMIN_EMAIL}`)
  } else {
    await prisma.user.create({
      data: { email: ADMIN_EMAIL, passwordHash, role: 'ADMIN' },
    })
    console.log(`✅ Admin creado: ${ADMIN_EMAIL}`)
  }

  // Inmobiliaria de prueba
  const agencyUserExists = await prisma.user.findUnique({ where: { email: 'inmobiliaria@test.com' } })
  if (!agencyUserExists) {
    await prisma.user.create({
      data: {
        email: 'inmobiliaria@test.com',
        passwordHash: await bcrypt.hash('Agency1234!', 12),
        role: 'AGENCY',
        agency: {
          create: {
            name: 'Inmobiliaria Test',
            phone: '+5429112345678',
            address: 'Av. Alem 1234',
            city: 'Bahia Blanca',
            licenseNumber: 'MAT-001',
            dniFrontUrl: 'placeholder/dni_front',
            dniBackUrl: 'placeholder/dni_back',
            selfieUrl: 'placeholder/selfie',
            verificationStatus: 'APPROVED',
            isVerified: true,
          },
        },
      },
    })
    console.log('✅ Inmobiliaria de prueba creada: inmobiliaria@test.com / Agency1234!')
  }

  // Particular de prueba
  const particularUserExists = await prisma.user.findUnique({ where: { email: 'particular@test.com' } })
  if (!particularUserExists) {
    await prisma.user.create({
      data: {
        email: 'particular@test.com',
        passwordHash: await bcrypt.hash('Particular1234!', 12),
        role: 'PARTICULAR',
        particular: {
          create: {
            firstName: 'Juan',
            lastName: 'Pérez',
            phone: '+5429187654321',
            city: 'Bahia Blanca',
            dniFrontUrl: 'placeholder/dni_front',
            dniBackUrl: 'placeholder/dni_back',
            selfieUrl: 'placeholder/selfie',
            verificationStatus: 'APPROVED',
            isVerified: true,
          },
        },
      },
    })
    console.log('✅ Particular de prueba creado: particular@test.com / Particular1234!')
  }

  console.log('🎉 Seed completado')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
