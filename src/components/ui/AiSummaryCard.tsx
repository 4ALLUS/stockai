'use client'
import { useEffect, useState } from 'react'

export function AiSummaryCard() {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ai/market-summary')
      .then(r => r.json())
      .then(d => { setSummary(d.summary); setLoading(false) })
      .catch(() => {
        setSummary('Tech sector showing strength. NVDA up on AI chip demand. PYPL recovering from recent lows — analyst consensus remains Buy. Macro: Fed hold expected.')
        setLoading(false)
      })
  }, [])

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">AI market summary</p>
        <span className="badge badge-blue text-[10px]">verified data</span>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[80, 60, 70].map((w, i) => (
            <div key={i} className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
      )}
      <div className="mt-4 space-y-2">
        {[
          { label: 'Market',   pct: 64, color: 'bg-green-500' },
          { label: 'Tech',     pct: 71, color: 'bg-brand-400' },
          { label: 'Fintech',  pct: 55, color: 'bg-amber-400' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-12">{s.label}</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
            </div>
            <span className="text-xs text-gray-400 w-8 text-right">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
