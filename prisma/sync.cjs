const { PrismaClient } = require('@prisma/client')
const { readFileSync, readdirSync, statSync } = require('fs')
const { resolve } = require('path')
const { execSync } = require('child_process')
const prisma = new PrismaClient()

async function applyMigrations() {
  const migrationsDir = resolve(__dirname, 'migrations')

  // Read all migration folders sorted by name
  const folders = readdirSync(migrationsDir)
    .filter((name) => /^\d+/.test(name))
    .sort()

  for (const folder of folders) {
    const sqlPath = resolve(migrationsDir, folder, 'migration.sql')
    if (!statSync(sqlPath).isFile()) continue

    console.log(`  Applying migration: ${folder}`)
    const sql = readFileSync(sqlPath, 'utf8')

    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => s.replace(/^--.*$/gm, '').trim())
      .filter((s) => s.length > 0 && !/^CREATE\s+SCHEMA/i.test(s))

    for (const stmt of statements) {
      await prisma.$executeRawUnsafe(stmt + ';')
    }
  }

  console.log('Database schema synced successfully')
  await prisma.$disconnect()
}

async function main() {
  await applyMigrations()

  // Seed if database is empty
  try {
    execSync('npx tsx prisma/seed-init.ts', { stdio: 'inherit', cwd: resolve(__dirname, '..') })
  } catch (e) {
    console.error('Seed failed:', e.message)
    process.exit(1)
  }

  require(resolve(__dirname, '../server.js'))
}

main().catch((e) => {
  console.error('Startup failed:', e)
  process.exit(1)
})
