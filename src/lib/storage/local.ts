import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import type { StorageProvider } from './types'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export const localStorageProvider: StorageProvider = {
  async save(file, fileName) {
    await mkdir(UPLOAD_DIR, { recursive: true })
    const bytes = await file.arrayBuffer()
    await writeFile(path.join(UPLOAD_DIR, fileName), Buffer.from(bytes))
    return `/uploads/${fileName}`
  },

  async delete(key) {
    const filePath = path.join(UPLOAD_DIR, path.basename(key))
    await unlink(filePath).catch(() => {})
  },

  getUrl(key) {
    return `/uploads/${path.basename(key)}`
  },
}
