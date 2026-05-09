export function LineChart({
  data,
  height = 120,
}: {
  data: { label: string; value: number }[]
  height?: number
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const min = Math.min(...data.map((d) => d.value), 0)
  const range = max - min || 1
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${((max - d.value) / range) * 100}`).join(' ')

  return (
    <div className="relative" style={{ height }}>
      {/* Y-axis labels */}
      <div className="absolute -left-1 top-0 flex h-full flex-col justify-between text-[10px] text-muted-foreground">
        <span>{max}</span>
        <span>{Math.round((max + min) / 2)}</span>
        <span>{min}</span>
      </div>
      {/* Chart area */}
      <div className="ml-7 h-full">
        <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
          {/* Grid lines */}
          <line x1="0" y1="0" x2="100" y2="0" stroke="hsl(var(--border))" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="hsl(var(--border))" strokeWidth="0.5" />
          <line x1="0" y1="100" x2="100" y2="100" stroke="hsl(var(--border))" strokeWidth="0.5" />
          {/* Area fill */}
          <polyline
            points={`0,100 ${points} 100,100`}
            fill="hsl(var(--primary) / 0.1)"
            stroke="none"
          />
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Dots */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={(i / (data.length - 1)) * 100}
              cy={((max - d.value) / range) * 100}
              r="2"
              fill="hsl(var(--background))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
          ))}
        </svg>
        {/* X-axis labels */}
        <div className="flex justify-between pt-1">
          {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 7)) === 0 || i === data.length - 1).map((d) => (
            <span key={d.label} className="text-[9px] text-muted-foreground">{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
