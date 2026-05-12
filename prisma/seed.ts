import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed database with initial data
 */
async function main() {
  console.log('🌱 Seeding database...')

  // Create prize categories
  const prizeCategories = await Promise.all([
    prisma.prizeCategory.upsert({
      where: { id: 'cat-1' },
      update: {},
      create: {
        id: 'cat-1',
        name: 'Recompensas Ecológicas',
        description: 'Productos y recompensas relacionadas con el medio ambiente',
      },
    }),
    prisma.prizeCategory.upsert({
      where: { id: 'cat-2' },
      update: {},
      create: {
        id: 'cat-2',
        name: 'Entretenimiento',
        description: 'Artículos de entretenimiento y ocio',
      },
    }),
  ])

  console.log(`✓ Created ${prizeCategories.length} prize categories`)

  // Create test prizes
  const prizes = await Promise.all([
    prisma.prize.upsert({
      where: { id: 'prize-1' },
      update: {},
      create: {
        id: 'prize-1',
        name: 'Botella Reutilizable Eco',
        description: 'Botella de agua reutilizable hecha con materiales reciclados',
        cost: 50,
        categoryId: 'cat-1',
        icon: '🌿',
      },
    }),
    prisma.prize.upsert({
      where: { id: 'prize-2' },
      update: {},
      create: {
        id: 'prize-2',
        name: 'Bolsa Reutilizable Premium',
        description: 'Bolsa de tela premium para compras',
        cost: 75,
        categoryId: 'cat-1',
        icon: '👜',
      },
    }),
    prisma.prize.upsert({
      where: { id: 'prize-3' },
      update: {},
      create: {
        id: 'prize-3',
        name: 'Cupón Café Ecológico',
        description: 'Cupón de $50 para café de comercio justo',
        cost: 100,
        categoryId: 'cat-1',
        icon: '☕',
      },
    }),
    prisma.prize.upsert({
      where: { id: 'prize-4' },
      update: {},
      create: {
        id: 'prize-4',
        name: 'Descuento en Tienda Local',
        description: 'Descuento del 20% en tienda de ropa sostenible',
        cost: 120,
        categoryId: 'cat-1',
        icon: '🛍️',
      },
    }),
    prisma.prize.upsert({
      where: { id: 'prize-5' },
      update: {},
      create: {
        id: 'prize-5',
        name: 'Entrada Cine',
        description: 'Entrada de cine válida por 30 días',
        cost: 200,
        categoryId: 'cat-2',
        icon: '🎬',
      },
    }),
  ])

  console.log(`✓ Created ${prizes.length} prizes`)

  // Create a test user first
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test Student',
      role: 'student',
    },
  })

  console.log(`✓ Created test user: ${testUser.email}`)

  // Get or create a test student linked to the user
  const testStudent = await prisma.student.upsert({
    where: { boleta: 'TEST001' },
    update: {},
    create: {
      boleta: 'TEST001',
      userId: testUser.id,
      ecoPoints: 100,
      level: '1',
      classifications: 0,
    },
  })

  console.log(`✓ Created test student: ${testStudent.boleta} with ${testStudent.ecoPoints} eco points`)

  console.log('✅ Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error in seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
