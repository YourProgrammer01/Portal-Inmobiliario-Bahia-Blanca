import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] ?? 'admin@pib.com.ar'
const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] ?? 'Admin1234!'

async function main() {
  console.log('🌱 Iniciando seed...')

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

  console.log('🎉 Seed completado')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
