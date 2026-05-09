import { Skeleton } from '@/components/ui/skeleton'

export default function JobDetailLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Skeleton className="h-6 w-32" />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Skeleton className="mb-4 h-8 w-24" />
        <div className="space-y-4 rounded-xl border p-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-1.5">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </main>
    </div>
  )
}
