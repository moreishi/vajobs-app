import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  params,
}: {
  currentPage: number
  totalPages: number
  basePath: string
  params: Record<string, string>
}) {
  if (totalPages <= 1) return null

  function buildUrl(page: number) {
    const search = new URLSearchParams(params)
    if (page > 1) search.set('page', String(page))
    else search.delete('page')
    const qs = search.toString()
    return `${basePath}${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {currentPage > 1 && (
        <Link href={buildUrl(currentPage - 1)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Previous
        </Link>
      )}

      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
        .map((p, idx, arr) => (
          <span key={p} className="flex items-center">
            {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-muted-foreground">...</span>}
            {p === currentPage ? (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground">
                {p}
              </span>
            ) : (
              <Link
                href={buildUrl(p)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-muted-foreground hover:bg-muted"
              >
                {p}
              </Link>
            )}
          </span>
        ))}

      {currentPage < totalPages && (
        <Link href={buildUrl(currentPage + 1)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Next
        </Link>
      )}
    </div>
  )
}
