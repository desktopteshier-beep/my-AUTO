type Point = { label: string; count: number }

export function ActivityChart({ data }: { data: Point[] }) {
  const max = Math.max(1, ...data.map(point => point.count))
  const summary = data.map(point => `${point.label} ${point.count}`).join(', ')
  return <div className="chart" role="img" aria-label={`Activity per day: ${summary}`}>
    <div className="chart-bars" aria-hidden="true">
      {data.map(point => <div key={point.label} className="chart-col">
        <button type="button" className="chart-bar" style={{ height: `${Math.max(4, (point.count / max) * 100)}%` }} tabIndex={-1}>
          <span className="chart-tip">{point.label}: {point.count}</span>
        </button>
      </div>)}
    </div>
    <div className="chart-labels" aria-hidden="true">{data.map(point => <span key={point.label}>{point.label}</span>)}</div>
  </div>
}
