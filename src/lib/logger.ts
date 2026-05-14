import * as fs from 'fs'
import * as path from 'path'

const LOG_DIR = path.resolve(process.cwd(), 'logs')

type LogLevel = 'INFO' | 'WARN' | 'ERROR'

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }
}

function dateStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function timestamp() {
  return new Date().toISOString().replace('T', ' ').replace('Z', '')
}

function write(level: LogLevel, label: string, message: string, meta?: unknown) {
  try {
    ensureLogDir()
    const date = dateStr()
    const file = path.join(LOG_DIR, `${level.toLowerCase()}-${date}.log`)

    let line = `[${timestamp()}] [${level}] [${label}] ${message}`
    if (meta !== undefined) {
      line += `\n  ${typeof meta === 'object' ? JSON.stringify(meta, null, 2) : String(meta)}`
    }
    line += '\n'

    fs.appendFileSync(file, line, 'utf-8')

    // Also write to a combined log
    const combinedFile = path.join(LOG_DIR, `combined-${date}.log`)
    fs.appendFileSync(combinedFile, line, 'utf-8')
  } catch {
    // Fail silently — logging should never crash the app
  }
}

export const logger = {
  info(label: string, message: string, meta?: unknown) {
    write('INFO', label, message, meta)
  },
  warn(label: string, message: string, meta?: unknown) {
    write('WARN', label, message, meta)
  },
  error(label: string, message: string, meta?: unknown) {
    write('ERROR', label, message, meta)
  },
}
