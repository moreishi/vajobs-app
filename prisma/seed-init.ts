import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const userCount = await prisma.user.count()
  if (userCount > 0) {
    console.log('  Database already seeded — skipping')
    return
  }

  console.log('  Empty database detected — running seed...')
  await import('./seed')
}

main()
  .catch((e) => {
    console.error('Seed init failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
