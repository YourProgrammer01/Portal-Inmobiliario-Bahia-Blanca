import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Admin
  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@pib.com.ar' } })
  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: 'admin@pib.com.ar',
        passwordHash: await bcrypt.hash('Admin1234!', 12),
        role: 'ADMIN',
      },
    })
    console.log('✅ Admin creado: admin@pib.com.ar / Admin1234!')
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
