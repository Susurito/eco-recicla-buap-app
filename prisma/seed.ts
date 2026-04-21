import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed database with initial data
 */
async function main() {
}

main()
  .catch((e) => {
    console.error('❌ Error in seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
