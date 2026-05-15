const { PrismaClient } = require('@prisma/client')
const { readFileSync, readdirSync, statSync } = require('fs')
const { resolve } = require('path')
const { execSync } = require('child_process')
const prisma = new PrismaClient()

const TRACKING_TABLE = '_schema_migrations'

async function ensureTrackingTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${TRACKING_TABLE}" (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
}

async function getAppliedMigrations() {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT name FROM "${TRACKING_TABLE}" ORDER BY name`
  )
  return new Set(rows.map((r) => r.name))
}

async function applyMigrations() {
  const migrationsDir = resolve(__dirname, 'migrations')

  const folders = readdirSync(migrationsDir)
    .filter((name) => /^\d+/.test(name))
    .sort()

  await ensureTrackingTable()
  const applied = await getAppliedMigrations()

  for (const folder of folders) {
    if (applied.has(folder)) {
      console.log(`  Already applied: ${folder}`)
      continue
    }

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

    await prisma.$transaction(async (tx) => {
      for (const stmt of statements) {
        await tx.$executeRawUnsafe(stmt + ';')
      }
      await tx.$executeRawUnsafe(
        `INSERT INTO "${TRACKING_TABLE}" (name) VALUES ('${folder}')`
      )
    })
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
