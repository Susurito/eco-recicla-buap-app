import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed database with initial data
 * 
 * NOTE: This seed file has been cleaned to remove auto-population logic.
 * Data is now managed via:
 * 1. Prisma Studio - npx prisma studio
 * 2. API endpoints (POST requests)
 * 3. Manual database operations
 * 
 * No dependencies on hardcoded container or stats data.
 */
async function main() {
  console.log('🌱 Seed initialized')
  console.log('📝 To add data:')
  console.log('   1. Use Prisma Studio: npx prisma studio')
  console.log('   2. Use API endpoints: POST /api/trash-points, POST /api/prizes')
  console.log('   3. Or connect directly to your database')
}

main()
  .catch((e) => {
    console.error('❌ Error in seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
