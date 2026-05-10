import { Card, CardContent } from '@/components/ui/card'
import { ExternalLinkIcon, FolderIcon, AwardIcon, LinkIcon, FileTextIcon } from 'lucide-react'
import type { PortfolioItemData } from '@/actions/portfolio'

const typeConfig: Record<string, { label: string; icon: typeof FolderIcon }> = {
  project: { label: 'Project', icon: FolderIcon },
  certification: { label: 'Certification', icon: AwardIcon },
  work_sample: { label: 'Work Sample', icon: FileTextIcon },
  link: { label: 'Link', icon: LinkIcon },
}

export function PortfolioGallery({ items }: { items: PortfolioItemData[] }) {
  if (items.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Portfolio</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const config = typeConfig[item.type] || { label: item.type, icon: FolderIcon }
          const Icon = config.icon

          return (
            <Card key={item.id} className="group relative">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm font-medium">{item.title}</h3>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLinkIcon className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize mt-0.5">
                      {config.label}
                    </span>
                    {item.description && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-3">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
