'use client'
import { useEffect, useState } from 'react'
import { Download, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { MetricCard } from './MetricCard'
import dynamic from 'next/dynamic'

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
  const decodedTicker = decodeURIComponent(ticker)
  const [data, setData]       = useState<StockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(`/api/stock/${encodeURIComponent(decodedTicker)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load data'); setLoading(false) })
  }, [decodedTicker])

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

  return (
    <div>
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
          <button className="btn-secondary flex items-center gap-2">
            <Download size={14}/> Download PDF
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={14}/> Add to portfolio
          </button>
        </div>
      </div>

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

      {data.history && data.history.length > 0 && (
        <div className="card mb-5">
          <p className="text-sm font-medium text-gray-500 mb-3">Price chart — 1 year · candlestick + MA50 + MA200 + volume</p>
          <CandlestickChart history={data.history} />
        </div>
      )}

      {high52 > 0 && low52 > 0 && (
        <div className="card mb-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">52-week range</p>
          <div className="relative h-2 bg-gray-100 rounded-full mb-4">
            <div className="absolute h-full bg-brand rounded-full" style={{ width: `${Math.min(Math.max(rangePct, 2), 98)}%` }} />
            <div className="absolute w-3 h-3 bg-brand-800 rounded-full -top-0.5 -translate-x-1/2 border-2 border-white" style={{ left: `${Math.min(Math.max(rangePct, 2), 98)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Low ${safe(low52)}</span>
            <span className="font-medium text-gray-700">Current ${safe(price)}</span>
            <span>High ${safe(high52)}</span>
          </div>
        </div>
      )}

      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm font-medium text-gray-500">AI analysis</p>
          <span className="badge badge-blue text-[10px]">verified sources · no hallucinations</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{data.aiSummary}</p>
      </div>

      {isStock ? (
        <div className="card">
          <p className="text-sm font-medium text-gray-500 mb-3">Analyst consensus</p>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className={`text-2xl font-medium ${
                data.recommendation === 'Buy' ? 'text-green-600' :
                data.recommendation === 'Sell' ? 'text-red-600' : 'text-gray-700'
              }`}>{data.recommendation}</p>
              <p className="text-xs text-gray-400">Consensus</p>
            </div>
            <div className="flex-1">
              <div className="flex gap-1 h-8 items-end mb-1">
                {[
                  { label: 'S.Buy', val: data.analysts?.strongBuy ?? 0,  color: 'bg-green-600' },
                  { label: 'Buy',   val: data.analysts?.buy ?? 0,        color: 'bg-green-400' },
                  { label: 'Hold',  val: data.analysts?.hold ?? 0,       color: 'bg-gray-300' },
                  { label: 'Sell',  val: data.analysts?.sell ?? 0,       color: 'bg-red-400' },
                  { label: 'S.Sell',val: data.analysts?.strongSell ?? 0, color: 'bg-red-600' },
                ].map(b => {
                  const maxVal = Math.max(
                    data.analysts?.strongBuy ?? 0,
                    data.analysts?.buy ?? 0,
                    data.analysts?.hold ?? 0,
                    data.analysts?.sell ?? 0,
                    data.analysts?.strongSell ?? 0,
                    1
                  )
                  return (
                    <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-500">{b.val}</span>
                      <div className={`w-full rounded-sm ${b.color}`} style={{ height: `${(b.val/maxVal)*100}%` }} />
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-1">
                {['S.Buy','Buy','Hold','Sell','S.Sell'].map(l => (
                  <span key={l} className="flex-1 text-center text-[9px] text-gray-400">{l}</span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-medium text-gray-900">${safe(target)}</p>
              <p className="text-xs text-gray-400">Mean target</p>
              {upside !== 'N/A' && (
                <p className={`text-xs mt-0.5 ${parseFloat(upside) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(upside) >= 0 ? '+' : ''}{upside}% upside
                </p>
              )}
            </div>
          </div>
        </div>
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
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full ${
                data.fearGreed.value >= 60 ? 'bg-green-500' :
                data.fearGreed.value >= 40 ? 'bg-amber-400' : 'bg-red-500'
              }`}
              style={{ width: `${data.fearGreed.value}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Extreme Fear (0)</span>
            <span>Neutral (50)</span>
            <span>Extreme Greed (100)</span>
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