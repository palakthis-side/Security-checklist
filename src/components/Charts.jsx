import { useLayoutEffect, useRef, useState } from 'react'

const MAX_BAR = 24

function useMeasuredWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const node = ref.current
    setWidth(node.clientWidth)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

function useTooltip() {
  const ref = useRef(null)
  const [tip, setTip] = useState(null)
  const show = (event, content, anchored) => {
    const bounds = ref.current.getBoundingClientRect()
    const mark = anchored ? event.currentTarget.getBoundingClientRect() : null
    const rawX = mark ? mark.left + mark.width / 2 - bounds.left : event.clientX - bounds.left
    const y = mark ? mark.top - bounds.top : event.clientY - bounds.top
    setTip({ x: Math.max(78, Math.min(rawX, bounds.width - 78)), y, ...content })
  }
  const hide = () => setTip(null)
  return { ref, tip, show, hide }
}

function Tooltip({ tip }) {
  if (!tip) return null
  return <div className="chart-tip" style={{ left: `${tip.x}px`, top: `${tip.y}px` }} aria-hidden="true">
    <span className="chart-tip-label">{tip.label}</span>
    {tip.rows.map((row) => <span className="chart-tip-row" key={row.name}>
      <i style={{ background: row.color }} />
      <strong>{row.value}</strong>
      <small>{row.name}</small>
    </span>)}
  </div>
}

export function ChartCard({ title, subtitle, legend, span, children, table }) {
  const [view, setView] = useState('chart')
  return <section className={`chart-card ${span ? 'chart-card-wide' : ''}`}>
    <header className="chart-card-head">
      <div><h3>{title}</h3><p>{subtitle}</p></div>
      <div className="view-toggle">
        <button type="button" className={view === 'chart' ? 'active' : ''} aria-pressed={view === 'chart'} onClick={() => setView('chart')}>Chart</button>
        <button type="button" className={view === 'table' ? 'active' : ''} aria-pressed={view === 'table'} onClick={() => setView('table')}>Table</button>
      </div>
    </header>
    {legend && <div className="chart-legend">{legend.map((entry) => <span key={entry.name}><i style={{ background: entry.color }} />{entry.name}</span>)}</div>}
    {view === 'chart' ? children : <div className="chart-table">{table}</div>}
  </section>
}

export function CoverageByCategory({ rows }) {
  const { ref, tip, show, hide } = useTooltip()
  return <div className="hbar-chart" ref={ref}>
    <div className="hbar-labels">{rows.map((row) => <span key={row.name} title={row.name}>{row.name}</span>)}</div>
    <div className="hbar-plot">
      {rows.map((row) => {
        const tipContent = { label: row.name, rows: [{ name: `of ${row.total} checks complete`, value: `${row.percent}%`, color: 'var(--viz-good)' }] }
        return <div
          key={row.name}
          className="hbar-cell"
          tabIndex={0}
          aria-label={`${row.name}: ${row.completed} of ${row.total} checks complete, ${row.percent} percent`}
          onPointerMove={(event) => show(event, tipContent)}
          onPointerLeave={hide}
          onFocus={(event) => show(event, tipContent, true)}
          onBlur={hide}
        >
          <span className="hbar-track"><span className="hbar-fill" style={{ width: `${row.percent}%` }} /></span>
        </div>
      })}
    </div>
    <div className="hbar-values">{rows.map((row) => <span key={row.name}>{row.percent}<small>%</small></span>)}</div>
    <Tooltip tip={tip} />
  </div>
}

function columnPath(x, y, width, height, radius) {
  if (height <= 0) return ''
  const r = Math.min(radius, width / 2, height)
  return `M${x},${y + height}L${x},${y + r}Q${x},${y} ${x + r},${y}L${x + width - r},${y}Q${x + width},${y} ${x + width},${y + r}L${x + width},${y + height}Z`
}

function niceTicks(max) {
  if (max <= 0) return { top: 1, ticks: [0, 1] }
  const rough = max / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 5, 10].map((multiple) => multiple * magnitude).find((candidate) => candidate >= rough) ?? magnitude * 10
  const top = Math.ceil(max / step) * step
  const ticks = []
  for (let value = 0; value <= top; value += step) ticks.push(value)
  return { top, ticks }
}

export function PriorityComparison({ rows, series }) {
  const [wrapRef, width] = useMeasuredWidth()
  const { ref, tip, show, hide } = useTooltip()
  const height = 224
  const pad = { top: 26, right: 8, bottom: 34, left: 30 }
  const { top, ticks } = niceTicks(Math.max(...rows.map((row) => Math.max(...series.map((entry) => entry.value(row))))))
  const plotWidth = Math.max(0, width - pad.left - pad.right)
  const plotHeight = height - pad.top - pad.bottom
  const baseline = pad.top + plotHeight
  const band = plotWidth / (rows.length || 1)
  const barWidth = Math.max(8, Math.min(MAX_BAR, (band * 0.62 - 2) / series.length))
  const pairWidth = barWidth * series.length + 2 * (series.length - 1)
  return <div className="svg-chart" ref={ref}>
    <div ref={wrapRef}>
      {width > 0 && <svg width={width} height={height} role="group" aria-label="Completed and outstanding checks by priority">
        <g aria-hidden="true">
          {ticks.map((tick) => {
            const y = baseline - (tick / top) * plotHeight
            return <g key={tick}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="var(--viz-grid)" strokeWidth="1" />
              <text x={pad.left - 8} y={y + 3} textAnchor="end" className="axis-text">{tick}</text>
            </g>
          })}
        </g>
        {rows.map((row, index) => {
          const center = pad.left + band * (index + 0.5)
          const startX = center - pairWidth / 2
          return <g key={row.priority}>
            <text x={center} y={baseline + 19} textAnchor="middle" className="axis-text" aria-hidden="true">{row.priority}</text>
            {series.map((entry, seriesIndex) => {
              const value = entry.value(row)
              const barHeight = (value / top) * plotHeight
              const x = startX + seriesIndex * (barWidth + 2)
              const y = baseline - barHeight
              const tipContent = { label: `${row.priority} priority`, rows: series.map((item) => ({ name: item.name, value: item.value(row), color: item.color })) }
              return <g key={entry.name}>
                <path d={columnPath(x, y, barWidth, barHeight, 4)} fill={entry.color} aria-hidden="true" />
                <text x={x + barWidth / 2} y={y - 7} textAnchor="middle" className="axis-text value" aria-hidden="true">{value}</text>
                <rect
                  x={x - 1} y={pad.top} width={barWidth + 2} height={plotHeight} fill="transparent" tabIndex={0}
                  aria-label={`${row.priority} priority, ${entry.name}: ${value} checks`}
                  onPointerMove={(event) => show(event, tipContent)} onPointerLeave={hide}
                  onFocus={(event) => show(event, tipContent, true)} onBlur={hide}
                />
              </g>
            })}
          </g>
        })}
        <line x1={pad.left} x2={width - pad.right} y1={baseline} y2={baseline} stroke="var(--viz-axis)" strokeWidth="1" />
      </svg>}
    </div>
    <Tooltip tip={tip} />
  </div>
}

export function OutstandingByCategory({ rows, series }) {
  const { ref, tip, show, hide } = useTooltip()
  const max = Math.max(1, ...rows.map((row) => series.reduce((sum, entry) => sum + entry.value(row), 0)))
  return <div className="hbar-chart hbar-chart-risk" ref={ref}>
    <div className="hbar-labels">{rows.map((row) => <span key={row.name} title={row.name}>{row.name}</span>)}</div>
    <div className="hbar-plot">
      {rows.map((row) => {
        const total = series.reduce((sum, entry) => sum + entry.value(row), 0)
        const tipContent = { label: row.name, rows: series.map((entry) => ({ name: `${entry.name} outstanding`, value: entry.value(row), color: entry.color })) }
        return <div
          key={row.name}
          className="hbar-cell"
          tabIndex={0}
          aria-label={`${row.name}: ${total} outstanding — ${series.map((entry) => `${entry.value(row)} ${entry.name}`).join(', ')}`}
          onPointerMove={(event) => show(event, tipContent)} onPointerLeave={hide}
          onFocus={(event) => show(event, tipContent, true)} onBlur={hide}
        >
          <span className="hbar-track">
            <span className="hbar-stack" style={{ width: `${(total / max) * 100}%` }}>
              {series.map((entry) => entry.value(row) > 0 && <span key={entry.name} className="hbar-segment" style={{ flexGrow: entry.value(row), background: entry.color }} />)}
            </span>
          </span>
        </div>
      })}
    </div>
    <div className="hbar-values">{rows.map((row) => <span key={row.name}>{series.reduce((sum, entry) => sum + entry.value(row), 0)}</span>)}</div>
    <Tooltip tip={tip} />
  </div>
}
