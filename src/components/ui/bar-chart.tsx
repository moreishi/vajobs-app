export function BarChart({
  data,
  height = 120,
}: {
  data: { label: string; value: number }[]
  height?: number
}) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d) => (
        <div
          key={d.label}
          className="flex flex-1 flex-col items-center gap-1"
        >
          <span className="text-[10px] font-medium tabular-nums text-muted-foreground">{d.value}</span>
          <div
            className="w-full rounded-t bg-primary/60 transition-all hover:bg-primary/80"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }}
          />
          <span className="text-[9px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
