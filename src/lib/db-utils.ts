const isPostgres = process.env.NODE_ENV === 'production'

export const ci = (val: string) =>
  isPostgres ? { contains: val, mode: 'insensitive' as const } : { contains: val }
