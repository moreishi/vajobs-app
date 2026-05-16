export function GroupedBarChart({
  data,
  series,
  height = 120,
}: {
  data: { label: string; values: { name: string; value: number }[] }[]
  series: { name: string; color: string }[]
  height?: number
}) {
  const allValues = data.flatMap((d) => d.values.map((v) => v.value))
  const max = Math.max(...allValues, 1)

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((group, gi) => {
        const groupMax = Math.max(...group.values.map((v) => v.value), 1)
        return (
          <div key={group.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-end justify-center gap-0.5">
              {series.map((s) => {
                const val = group.values.find((v) => v.name === s.name)?.value ?? 0
                const pct = max > 0 ? (val / max) * 100 : 0
                return (
                  <div
                    key={s.name}
                    className="w-3 rounded-t transition-all hover:opacity-80"
                    style={{
                      height: `${pct}%`,
                      minHeight: val > 0 ? 4 : 0,
                      backgroundColor: s.color,
                    }}
                    title={`${s.name}: ${val}`}
                  />
                )
              })}
            </div>
            <span className="text-[9px] text-muted-foreground">{group.label}</span>
          </div>
        )
      })}
    </div>
  )
}
