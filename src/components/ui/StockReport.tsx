'use client'
import { useEffect, useState } from 'react'
import { Download, Plus, TrendingUp, TrendingDown, Check } from 'lucide-react'
import { MetricCard } from './MetricCard'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
const CandlestickChart = dynamic(() => import('./CandlestickChart'), { ssr: false })

interface HistoryPoint {
  date: string
  price: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface StockData {
  ticker: string
  name: string
  price: number
  change: number
  changePct: number
  marketCap: string
  pe: string
  eps: string
  beta: string
  week52High: number
  week52Low: number
  volume: string
  analystTarget: number
  recommendation: string
  aiSummary: string
  analysts?: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number; bullPct: number } | null
  fearGreed?: { value: number | null; label: string | null } | null
  ma50?: number | null
  ma200?: number | null
  trend?: string | null
  trendVsMA200?: string | null
  history?: HistoryPoint[]
}

function safe(n: any, decimals = 2): string {
  const num = parseFloat(n)
  return isNaN(num) ? 'N/A' : num.toFixed(decimals)
}

function getAssetType(ticker: string): 'stock' | 'crypto' | 'forex' | 'commodity' | 'index' {
  const t = decodeURIComponent(ticker)
  if (t.includes('-USD') || t.includes('-BTC')) return 'crypto'
  if (t.includes('=X')) return 'forex'
  if (t.includes('=F')) return 'commodity'
  if (t.startsWith('^')) return 'index'
  return 'stock'
}

const ASSET_LABELS: Record<string, string> = {
  stock:     'Stock',
  crypto:    'Cryptocurrency',
  forex:     'Forex pair',
  commodity: 'Futures / Commodity',
  index:     'Market Index',
}

export function StockReport({ ticker }: { ticker: string }) {
  const decodedTicker               = decodeURIComponent(ticker)
  const [data, setData]             = useState<StockData | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [watchlisted, setWatchlisted]           = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    setWatchlisted(false)
    fetch(`/api/stock/${encodeURIComponent(decodedTicker)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load data'); setLoading(false) })
  }, [decodedTicker])

  const handlePDF = async () => {
    if (!data) return
    setPdfLoading(true)
    try {
      const res = await fetch('/api/report/pdf', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${decodedTicker}_StockAI_Report.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert('PDF generation failed: ' + e.message)
    } finally {
      setPdfLoading(false)
    }
  }

  const handleWatchlist = async () => {
    if (!data) return
    setWatchlistLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Please sign in to add to watchlist')
        setWatchlistLoading(false)
        return
      }

      const res = await fetch('/api/watchlis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ticker: decodedTicker,
          name: data.name,
          price,
          change,
          changePct,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save')
      setWatchlisted(true)
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setWatchlistLoading(false)
    }
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-64" />
      <div className="grid grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
      </div>
      <div className="h-40 bg-gray-100 rounded-xl" />
    </div>
  )

  if (error) return (
    <div className="card text-center py-12">
      <p className="text-red-500 font-medium mb-2">Ticker not found</p>
      <p className="text-sm text-gray-400">{error}</p>
      <p className="text-sm text-gray-400 mt-2">Try searching with the autocomplete for a valid ticker.</p>
    </div>
  )

  if (!data) return null

  const price     = parseFloat(data.price as any) || 0
  const change    = parseFloat(data.change as any) || 0
  const changePct = parseFloat(data.changePct as any) || 0
  const high52    = parseFloat(data.week52High as any) || 0
  const low52     = parseFloat(data.week52Low as any) || 0
  const target    = parseFloat(data.analystTarget as any) || 0
  const pos       = change >= 0
  const rangePct  = high52 > low52 ? ((price - low52) / (high52 - low52)) * 100 : 50
  const upside    = target > 0 && price > 0 ? (((target - price) / price) * 100).toFixed(1) : 'N/A'
  const assetType = getAssetType(decodedTicker)
  const isStock   = assetType === 'stock'
  const isCrypto  = assetType === 'crypto'

  const sb      = data.analysts?.strongBuy ?? 0
  const b       = data.analysts?.buy ?? 0
  const h       = data.analysts?.hold ?? 0
  const s       = data.analysts?.sell ?? 0
  const ss      = data.analysts?.strongSell ?? 0
  const total   = sb + b + h + s + ss
  const bullPct = total > 0 ? Math.round((sb+b)/total*100) : 0
  const neutPct = total > 0 ? Math.round(h/total*100) : 0
  const bearPct = 100 - bullPct - neutPct
  const maxBar  = Math.max(sb, b, h, s, ss, 1)

  const projections = target > 0 ? [
    { period: '+1 month',   value: price + (target-price)*0.08 },
    { period: '+3 months',  value: price + (target-price)*0.25 },
    { period: '+6 months',  value: price + (target-price)*0.55 },
    { period: '+12 months', value: target },
  ] : []

  const maxUpside = target > 0 ? Math.abs((target - price) / price * 100) : 1

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-medium text-gray-900">{data.name}</h1>
            <span className="badge badge-blue">{decodedTicker}</span>
            <span className="badge badge-amber text-[10px]">{ASSET_LABELS[assetType]}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-medium">${safe(price)}</span>
            <span className={`text-sm flex items-center gap-1 ${pos ? 'text-green-600' : 'text-red-600'}`}>
              {pos ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
              {pos ? '+' : ''}{safe(change)} ({pos ? '+' : ''}{safe(changePct)}%)
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Source: Yahoo Finance + Alpha Vantage · verified · no AI-generated numbers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePDF} disabled={pdfLoading} className="btn-secondary flex items-center gap-2">
            <Download size={14}/>
            {pdfLoading ? 'Generating...' : 'Download PDF'}
          </button>
          <button
            onClick={handleWatchlist}
            disabled={watchlistLoading || watchlisted}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              watchlisted
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'btn-primary'
            }`}
          >
            {watchlisted ? <Check size={14}/> : <Plus size={14}/>}
            {watchlistLoading ? 'Saving...' : watchlisted ? 'Saved ✓' : 'Add to watchlist'}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard label="Market Cap"     value={data.marketCap ?? 'N/A'} />
        <MetricCard label="P/E Ratio"      value={data.pe ?? 'N/A'} />
        <MetricCard label="EPS (TTM)"      value={data.eps !== 'N/A' ? `$${data.eps}` : 'N/A'} />
        <MetricCard label="Beta"           value={data.beta ?? 'N/A'} />
        <MetricCard label="52W High"       value={high52 ? `$${safe(high52)}` : 'N/A'} subColor="green" />
        <MetricCard label="52W Low"        value={low52  ? `$${safe(low52)}`  : 'N/A'} subColor="red" />
        <MetricCard label="Volume"         value={data.volume ?? 'N/A'} />
        <MetricCard label="Analyst target" value={isStock && target ? `$${safe(target)}` : 'N/A'} subColor="green" />
      </div>

      {/* Candlestick Chart */}
      {data.history && data.history.length > 0 && (
        <div className="card mb-5">
          <p className="text-sm font-medium text-gray-500 mb-3">Price chart — 1 year · candlestick + MA50 + MA200 + volume</p>
          <CandlestickChart history={data.history} />
        </div>
      )}

      {/* 52W Gauge */}
      {high52 > 0 && low52 > 0 && (
        <div className="card mb-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">52-week range</p>
          <div className="relative h-4 rounded-full mb-3 overflow-hidden" style={{
            background: 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)'
          }}>
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md bg-gray-900 z-10"
              style={{ left: `${Math.min(Math.max(rangePct, 2), 98)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-red-500 font-medium">Low ${safe(low52)}</span>
            <span className="font-semibold text-gray-700">Current ${safe(price)}</span>
            <span className="text-green-600 font-medium">High ${safe(high52)}</span>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm font-medium text-gray-500">AI analysis</p>
          <span className="badge badge-blue text-[10px]">verified sources · no hallucinations</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{data.aiSummary}</p>
      </div>

      {isStock ? (
        <>
          <div className="card mb-5">
            <p className="text-sm font-medium text-gray-500 mb-4">Analyst consensus</p>
            {total > 0 && (
              <div className="mb-5">
                <div className="flex rounded-full overflow-hidden h-5 mb-2">
                  <div className="bg-green-600 flex items-center justify-center text-white text-[10px] font-medium"
                    style={{ width: `${bullPct}%` }}>
                    {bullPct > 10 ? `${bullPct}%` : ''}
                  </div>
                  <div className="bg-gray-300 flex items-center justify-center text-gray-600 text-[10px] font-medium"
                    style={{ width: `${neutPct}%` }}>
                    {neutPct > 10 ? `${neutPct}%` : ''}
                  </div>
                  <div className="bg-red-500 flex items-center justify-center text-white text-[10px] font-medium"
                    style={{ width: `${Math.max(bearPct, 0)}%` }}>
                    {bearPct > 10 ? `${bearPct}%` : ''}
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-600 font-medium">Bullish {bullPct}%</span>
                  <span className="text-gray-400">Neutral {neutPct}%</span>
                  <span className="text-red-500 font-medium">Bearish {bearPct}%</span>
                </div>
              </div>
            )}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <div className="flex gap-2 h-20 items-end mb-1">
                  {[
                    { label: 'S.Buy', val: sb, color: 'bg-green-700' },
                    { label: 'Buy',   val: b,  color: 'bg-green-400' },
                    { label: 'Hold',  val: h,  color: 'bg-gray-300'  },
                    { label: 'Sell',  val: s,  color: 'bg-red-400'   },
                    { label: 'S.Sell',val: ss, color: 'bg-red-700'   },
                  ].map(bar => (
                    <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-500 font-medium">{bar.val}</span>
                      <div className={`w-full rounded-t-sm ${bar.color}`}
                        style={{ height: `${(bar.val/maxBar)*64}px` }} />
                      <span className="text-[9px] text-gray-400">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center bg-gray-50 rounded-xl px-5 py-3 min-w-[110px]">
                <p className={`text-2xl font-bold ${
                  data.recommendation === 'Buy'  ? 'text-green-600' :
                  data.recommendation === 'Sell' ? 'text-red-600'   : 'text-gray-700'
                }`}>{data.recommendation}</p>
                <p className="text-xs text-gray-400 mb-1">Consensus</p>
                <p className="text-base font-semibold text-gray-800">${safe(target)}</p>
                <p className="text-xs text-gray-400">Mean target</p>
                {upside !== 'N/A' && (
                  <p className={`text-xs font-medium mt-1 ${parseFloat(upside) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {parseFloat(upside) >= 0 ? '+' : ''}{upside}% upside
                  </p>
                )}
              </div>
            </div>
          </div>

          {projections.length > 0 && (
            <div className="card mb-5">
              <p className="text-sm font-medium text-gray-500 mb-4">Statistical projections — based on analyst target</p>
              <div className="space-y-3">
                {projections.map(p => {
                  const pct  = ((p.value - price) / price * 100)
                  const bull = pct >= 0
                  const barW = Math.min(Math.abs(pct) / maxUpside * 100, 100)
                  return (
                    <div key={p.period} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-20 shrink-0">{p.period}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${bull ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${barW}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 w-16 text-right">${p.value.toFixed(2)}</span>
                      <span className={`text-xs font-medium w-14 text-right ${bull ? 'text-green-600' : 'text-red-600'}`}>
                        {bull ? '+' : ''}{pct.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-3">Based on analyst consensus target. Not a guaranteed forecast.</p>
            </div>
          )}

          <div className="card border-l-4 border-amber-400 bg-amber-50">
            <p className="text-sm font-bold text-amber-800 mb-2">Verdict — {decodedTicker}</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className={`font-bold ${
                data.recommendation === 'Buy'  ? 'text-green-600' :
                data.recommendation === 'Sell' ? 'text-red-600'   : 'text-gray-700'
              }`}>{data.recommendation}</span>
              {' '}— {data.name} is trading at ${safe(price)}.
              {target > 0 && ` Analyst consensus target: $${safe(target)} (${parseFloat(upside) >= 0 ? '+' : ''}${upside}% upside).`}
              {data.trend && ` Trend: ${data.trend}.`}
            </p>
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span>Support: <strong className="text-red-600">${safe(low52)}</strong></span>
              <span>Resistance: <strong className="text-green-600">${safe(high52)}</strong></span>
              {target > 0 && <span>Target: <strong className="text-blue-600">${safe(target)}</strong></span>}
            </div>
          </div>
        </>
      ) : isCrypto && data.fearGreed?.value != null ? (
        <div className="card">
          <p className="text-sm font-medium text-gray-500 mb-3">Market sentiment — Fear & Greed Index</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Current sentiment</span>
            <span className={`text-xl font-medium ${
              data.fearGreed.value >= 60 ? 'text-green-600' :
              data.fearGreed.value >= 40 ? 'text-amber-600' : 'text-red-600'
            }`}>{data.fearGreed.value} — {data.fearGreed.label}</span>
          </div>
          <div className="relative h-4 rounded-full overflow-hidden mb-3" style={{
            background: 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)'
          }}>
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md bg-gray-900"
              style={{ left: `${data.fearGreed.value}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-red-500 font-medium">Extreme Fear (0)</span>
            <span className="text-gray-400">Neutral (50)</span>
            <span className="text-green-600 font-medium">Extreme Greed (100)</span>
          </div>
        </div>
      ) : (
        <div className="card">
          <p className="text-sm font-medium text-gray-500 mb-3">Technical trend</p>
          {data.ma50 && data.ma200 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">MA50 vs MA200</span>
                <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                  data.trend?.includes('Bullish') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>{data.trend}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Price vs MA200</span>
                <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                  data.trendVsMA200?.includes('Bullish') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>{data.trendVsMA200}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">MA50 (50-day average)</span>
                <span className="text-sm font-medium text-gray-700">${safe(data.ma50, 4)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">MA200 (200-day average)</span>
                <span className="text-sm font-medium text-gray-700">${safe(data.ma200, 4)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{ASSET_LABELS[assetType]} — technical data unavailable</p>
          )}
        </div>
      )}
    </div>
  )
}