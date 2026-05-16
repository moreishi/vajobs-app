export interface StorageProvider {
  save(file: File, fileName: string): Promise<string>
  delete(key: string): Promise<void>
  getUrl(key: string): string
}
