const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.7)',
  'hsl(var(--primary) / 0.4)',
  'hsl(var(--destructive))',
  'hsl(var(--destructive) / 0.7)',
  'hsl(var(--secondary-foreground) / 0.3)',
]

export function PieChart({
  data,
  size = 120,
}: {
  data: { label: string; value: number; color?: string }[]
  size?: number
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 4

  let cumulative = 0
  const slices = data.map((d, i) => {
    const startAngle = (cumulative / total) * 360
    cumulative += d.value
    const endAngle = (cumulative / total) * 360
    const startRad = ((startAngle - 90) * Math.PI) / 180
    const endRad = ((endAngle - 90) * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    const color = d.color || COLORS[i % COLORS.length]

    return {
      path: d.value > 0
        ? `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
        : '',
      color,
      label: d.label,
      value: d.value,
      percent: Math.round((d.value / total) * 100),
    }
  })

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {slices.filter(s => s.path).map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="hsl(var(--background))" strokeWidth="1" />
        ))}
        {slices.length === 0 && (
          <circle cx={cx} cy={cy} r={r} fill="hsl(var(--muted))" />
        )}
      </svg>
      <div className="space-y-1.5 text-xs">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-medium tabular-nums">{s.value} ({s.percent}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}
