const { PrismaClient } = require('@prisma/client')
const { readFileSync } = require('fs')
const { resolve } = require('path')
const prisma = new PrismaClient()

async function applyMigrations() {
  const sql = readFileSync(
    resolve(__dirname, 'migrations/00000000000000_init/migration.sql'),
    'utf8'
  )

  // Split by semicolon, strip inline comments, filter empty/CREATE SCHEMA
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => s.replace(/^--.*$/gm, '').trim())
    .filter((s) => s.length > 0 && !/^CREATE\s+SCHEMA/i.test(s))

  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt + ';')
  }

  await prisma.$disconnect()
  console.log('Database schema synced successfully')
  require(resolve(__dirname, '../server.js'))
}

applyMigrations().catch((e) => {
  console.error('Migration failed:', e)
  process.exit(1)
})
