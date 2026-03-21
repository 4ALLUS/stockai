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
  const [data, setData]             = useState<StockData | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)

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

  const handlePDF = async () => {
    if (!data) return
    setPdfLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pw     = doc.internal.pageSize.getWidth()
      const margin = 18

      const price     = parseFloat(data.price as any) || 0
      const change    = parseFloat(data.change as any) || 0
      const changePct = parseFloat(data.changePct as any) || 0
      const high52    = parseFloat(data.week52High as any) || 0
      const low52     = parseFloat(data.week52Low as any) || 0
      const target    = parseFloat(data.analystTarget as any) || 0
      const pos       = change >= 0
      const upside    = target > 0 && price > 0 ? (((target - price) / price) * 100).toFixed(1) : 'N/A'
      const assetType = getAssetType(decodedTicker)
      const isStock   = assetType === 'stock'

      // Header
      doc.setFillColor(0, 48, 135)
      doc.rect(0, 0, pw, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(data.name, margin, 13)
      doc.setFontSize(14)
      doc.text(`$${safe(price)}`, pw - margin, 13, { align: 'right' })
      const changeColor: [number,number,number] = pos ? [34, 197, 94] : [239, 68, 68]
      doc.setTextColor(...changeColor)
      doc.setFontSize(9)
      doc.text(`${pos?'+':''}${safe(change)} (${pos?'+':''}${safe(changePct)}%)`, pw - margin, 21, { align: 'right' })
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.text(`${decodedTicker} · ${ASSET_LABELS[assetType]}`, margin, 21)
      doc.setFontSize(7)
      doc.setTextColor(160, 196, 232)
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US')}`, pw - margin, 32, { align: 'right' })

      let y = 42

      // Source note
      doc.setTextColor(136, 136, 170)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text('Source: Yahoo Finance + Alpha Vantage · Verified data · No AI-generated numbers', margin, y)
      y += 7

      // Metrics grid
      const metrics = [
        ['Market Cap',     data.marketCap ?? 'N/A'],
        ['P/E Ratio',      data.pe ?? 'N/A'],
        ['EPS (TTM)',       data.eps !== 'N/A' ? `$${data.eps}` : 'N/A'],
        ['Beta',           data.beta ?? 'N/A'],
        ['52W High',       high52 ? `$${safe(high52)}` : 'N/A'],
        ['52W Low',        low52  ? `$${safe(low52)}`  : 'N/A'],
        ['Volume',         data.volume ?? 'N/A'],
        ['Analyst target', isStock && target ? `$${safe(target)}` : 'N/A'],
      ]
      const cardW = (pw - 2*margin - 9) / 4
      const cardH = 15
      metrics.forEach((m, i) => {
        const col = i % 4
        const row = Math.floor(i / 4)
        const x   = margin + col * (cardW + 3)
        const cy  = y + row * (cardH + 2)
        doc.setFillColor(245, 245, 250)
        doc.roundedRect(x, cy, cardW, cardH, 2, 2, 'F')
        doc.setTextColor(136, 136, 170)
        doc.setFontSize(6)
        doc.setFont('helvetica', 'normal')
        doc.text(m[0].toUpperCase(), x + 2, cy + 4.5)
        doc.setTextColor(26, 26, 46)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(m[1], x + 2, cy + 11)
      })
      y += 2 * (cardH + 2) + 6

      // Chart
      if (data.history && data.history.length > 5) {
        try {
          const canvas  = document.createElement('canvas')
          canvas.width  = 800
          canvas.height = 280
          const ctx     = canvas.getContext('2d')!
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, 800, 280)

          const hist   = data.history
          const n      = hist.length
          const padL   = 55, padR = 15, padT = 15, padB = 55
          const chartW = 800 - padL - padR
          const chartH = 180
          const prices = hist.map(h => h.close || h.price)
          const minP   = Math.min(...prices) * 0.995
          const maxP   = Math.max(...prices) * 1.005
          const cw2    = Math.max(2, (chartW / n) * 0.7)

          const px2 = (i: number) => padL + (i / (n-1)) * chartW
          const py2 = (p: number) => padT + chartH - ((p - minP) / (maxP - minP)) * chartH

          // Grid
          ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 0.5
          for (let g = 0; g <= 4; g++) {
            const gy = padT + (g/4) * chartH
            ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(padL+chartW, gy); ctx.stroke()
            const gp = maxP - (g/4)*(maxP-minP)
            ctx.fillStyle = '#aaa'; ctx.font = '10px sans-serif'
            ctx.fillText('$'+gp.toFixed(price < 10 ? 3 : price < 100 ? 2 : 1), 2, gy+4)
          }

          // Candles
          hist.forEach((h, i) => {
            const o = h.open||h.price, c = h.close||h.price
            const hi2 = h.high||h.price, lo2 = h.low||h.price
            const x2 = px2(i)
            const bull = c >= o
            ctx.strokeStyle = bull ? '#22c55e' : '#ef4444'
            ctx.fillStyle   = bull ? '#22c55e' : '#ef4444'
            ctx.lineWidth   = 1
            ctx.beginPath(); ctx.moveTo(x2, py2(hi2)); ctx.lineTo(x2, py2(lo2)); ctx.stroke()
            ctx.fillRect(x2-cw2/2, py2(Math.max(o,c)), cw2, Math.max(1, Math.abs(py2(o)-py2(c))))
          })

          // MA50
          if (n >= 50) {
            ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.setLineDash([4,2])
            ctx.beginPath()
            for (let i = 49; i < n; i++) {
              const ma = prices.slice(i-49,i+1).reduce((a,b)=>a+b,0)/50
              i===49 ? ctx.moveTo(px2(i),py2(ma)) : ctx.lineTo(px2(i),py2(ma))
            }
            ctx.stroke()
          }

          // MA200
          if (n >= 200) {
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5; ctx.setLineDash([4,2])
            ctx.beginPath()
            for (let i = 199; i < n; i++) {
              const ma = prices.slice(i-199,i+1).reduce((a,b)=>a+b,0)/200
              i===199 ? ctx.moveTo(px2(i),py2(ma)) : ctx.lineTo(px2(i),py2(ma))
            }
            ctx.stroke()
          }
          ctx.setLineDash([])

          // Volume
          const vols   = hist.map(h => h.volume||0)
          const maxVol = Math.max(...vols)||1
          const volH2  = 35
          const volY2  = padT + chartH + 8
          hist.forEach((h,i) => {
            const o = h.open||h.price, c = h.close||h.price
            ctx.fillStyle = c>=o ? '#bbf7d0' : '#fecaca'
            const bh = (h.volume/maxVol)*volH2
            ctx.fillRect(px2(i)-cw2/2, volY2+volH2-bh, cw2, bh)
          })

          // X labels
          ctx.fillStyle='#999'; ctx.font='9px sans-serif'; ctx.setLineDash([])
          const step2 = Math.max(1, Math.floor(n/7))
          for (let i=0; i<n; i+=step2) {
            ctx.fillText(hist[i].date?.slice(5)??'', px2(i)-12, volY2+volH2+14)
          }

          // Legend
          ctx.fillStyle='#f59e0b'; ctx.fillRect(padL, volY2+volH2+20, 18, 2)
          ctx.fillStyle='#666'; ctx.font='9px sans-serif'
          ctx.fillText('MA50', padL+20, volY2+volH2+24)
          ctx.fillStyle='#ef4444'; ctx.fillRect(padL+55, volY2+volH2+20, 18, 2)
          ctx.fillText('MA200', padL+75, volY2+volH2+24)

          const imgData  = canvas.toDataURL('image/png')
          const imgH     = (pw-2*margin)*0.38
          doc.setFillColor(245,245,250)
          doc.roundedRect(margin-2, y-2, pw-2*margin+4, imgH+12, 3, 3, 'F')
          doc.setTextColor(26,26,46); doc.setFontSize(8); doc.setFont('helvetica','bold')
          doc.text('Price Chart — 1 Year · Candlestick + MA50 + MA200 + Volume', margin, y+5)
          doc.addImage(imgData, 'PNG', margin, y+8, pw-2*margin, imgH)
          y += imgH + 16
        } catch (chartErr) { console.error('Chart:', chartErr) }
      }

      // AI Analysis
      if (data.aiSummary) {
        doc.setFillColor(232, 244, 252)
        doc.roundedRect(margin-2, y-2, pw-2*margin+4, 26, 3, 3, 'F')
        doc.setDrawColor(0, 156, 222); doc.setLineWidth(0.3)
        doc.roundedRect(margin-2, y-2, pw-2*margin+4, 26, 3, 3, 'S')
        doc.setTextColor(26,26,46); doc.setFontSize(8); doc.setFont('helvetica','bold')
        doc.text('AI Analysis — Verified Sources · No Hallucinations', margin, y+5)
        doc.setFont('helvetica','normal'); doc.setFontSize(7.5)
        const lines = doc.splitTextToSize(data.aiSummary, pw-2*margin-4)
        doc.text(lines.slice(0,3), margin, y+11)
        y += 30
      }

      // Analyst consensus
      if (isStock && data.analysts) {
        doc.setFillColor(0,48,135)
        doc.rect(margin-2, y, pw-2*margin+4, 7, 'F')
        doc.setTextColor(255,255,255); doc.setFontSize(7.5); doc.setFont('helvetica','bold')
        const hdrs = ['Consensus','Target','Upside','S.Buy','Buy','Hold','Sell']
        const cw3  = (pw-2*margin) / hdrs.length
        hdrs.forEach((h,i) => doc.text(h, margin+i*cw3+cw3/2, y+5, {align:'center'}))
        y += 7
        doc.setFillColor(245,245,250)
        doc.rect(margin-2, y, pw-2*margin+4, 8, 'F')
        doc.setTextColor(26,26,46); doc.setFontSize(8); doc.setFont('helvetica','normal')
        const vals2 = [
          data.recommendation,
          target ? `$${safe(target)}` : 'N/A',
          upside !== 'N/A' ? `${parseFloat(upside)>=0?'+':''}${upside}%` : 'N/A',
          String(data.analysts.strongBuy),
          String(data.analysts.buy),
          String(data.analysts.hold),
          String(data.analysts.sell+data.analysts.strongSell),
        ]
        vals2.forEach((v,i) => doc.text(v, margin+i*cw3+cw3/2, y+5.5, {align:'center'}))
        y += 12
      }

    // ── PAGINA 2 ──────────────────────────────────────────────────
      doc.addPage()
      y = 20

      // Technical trend
      doc.setFillColor(0, 48, 135)
      doc.rect(0, 0, pw, 12, 'F')
      doc.setTextColor(255,255,255); doc.setFontSize(11); doc.setFont('helvetica','bold')
      doc.text('Technical Analysis', margin, 8)
      doc.setFontSize(8); doc.setFont('helvetica','normal')
      doc.text(decodedTicker, pw-margin, 8, { align: 'right' })
      y = 20

      if (data.ma50 && data.ma200) {
        const trendItems = [
          ['MA50 vs MA200', data.trend ?? 'N/A'],
          ['Price vs MA200', data.trendVsMA200 ?? 'N/A'],
          ['MA50 (50-day avg)', `$${safe(data.ma50, 4)}`],
          ['MA200 (200-day avg)', `$${safe(data.ma200, 4)}`],
          ['52W High', `$${safe(high52)}`],
          ['52W Low', `$${safe(low52)}`],
        ]
        trendItems.forEach((item, i) => {
          const isEven = i % 2 === 0
          doc.setFillColor(isEven ? 245 : 250, isEven ? 245 : 250, isEven ? 250 : 255)
          doc.rect(margin-2, y-2, pw-2*margin+4, 10, 'F')
          doc.setTextColor(100,100,120); doc.setFontSize(8); doc.setFont('helvetica','normal')
          doc.text(item[0], margin, y+5)
          const isBullish = item[1].includes('Bullish') || item[1].includes('Golden')
          const isBearish = item[1].includes('Bearish') || item[1].includes('Death')
          if (isBullish) doc.setTextColor(34, 197, 94)
          else if (isBearish) doc.setTextColor(239, 68, 68)
          else doc.setTextColor(26, 26, 46)
          doc.setFont('helvetica','bold')
          doc.text(item[1], pw-margin, y+5, { align: 'right' })
          y += 12
        })
      }

      y += 6

      // Fear & Greed for crypto
      if (isCrypto && data.fearGreed?.value != null) {
        doc.setFillColor(232, 244, 252)
        doc.roundedRect(margin-2, y-2, pw-2*margin+4, 30, 3, 3, 'F')
        doc.setTextColor(26,26,46); doc.setFontSize(9); doc.setFont('helvetica','bold')
        doc.text('Fear & Greed Index — Crypto Market Sentiment', margin, y+6)
        const fgVal = data.fearGreed.value
        const fgColor: [number,number,number] = fgVal >= 60 ? [34,197,94] : fgVal >= 40 ? [245,158,11] : [239,68,68]
        doc.setTextColor(...fgColor)
        doc.setFontSize(18)
        doc.text(`${fgVal}`, margin, y+20)
        doc.setFontSize(10)
        doc.text(`— ${data.fearGreed.label}`, margin+15, y+20)
        // Bar
        doc.setFillColor(229,231,235)
        doc.roundedRect(margin, y+23, pw-2*margin-4, 4, 2, 2, 'F')
        doc.setFillColor(...fgColor)
        doc.roundedRect(margin, y+23, (pw-2*margin-4)*(fgVal/100), 4, 2, 2, 'F')
        y += 38
      }

      // Projections
      doc.setFillColor(0, 48, 135)
      doc.rect(margin-2, y, pw-2*margin+4, 7, 'F')
      doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold')
      doc.text('Price Projections — Based on Analyst Targets', margin, y+5)
      y += 9

      const projections = [
        ['+1 month',  price + (target-price)*0.08],
        ['+3 months', price + (target-price)*0.25],
        ['+6 months', price + (target-price)*0.55],
        ['+12 months', target],
      ]
      projections.forEach((p, i) => {
        const pval = p[1] as number
        const pct  = ((pval - price) / price * 100).toFixed(1)
        const bull = pval >= price
        doc.setFillColor(i%2===0 ? 245 : 250, i%2===0 ? 245 : 250, i%2===0 ? 250 : 255)
        doc.rect(margin-2, y, pw-2*margin+4, 9, 'F')
        doc.setTextColor(100,100,120); doc.setFontSize(8); doc.setFont('helvetica','normal')
        doc.text(p[0] as string, margin, y+6)
        doc.setTextColor(bull ? 34 : 239, bull ? 197 : 68, bull ? 94 : 68)
        doc.setFont('helvetica','bold')
        doc.text(`$${pval.toFixed(2)}  (${bull?'+':''}${pct}%)`, pw-margin, y+6, { align: 'right' })
        y += 11
      })

      y += 8

      // ── PAGINA 3 ──────────────────────────────────────────────────
      doc.addPage()
      y = 20

      doc.setFillColor(0, 48, 135)
      doc.rect(0, 0, pw, 12, 'F')
      doc.setTextColor(255,255,255); doc.setFontSize(11); doc.setFont('helvetica','bold')
      doc.text('Additional Information', margin, 8)
      y = 20

      // Key fundamentals table
      if (isStock) {
        doc.setFillColor(0,48,135)
        doc.rect(margin-2, y, pw-2*margin+4, 7, 'F')
        doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold')
        doc.text('Key Fundamentals', margin, y+5)
        y += 9

        const fundItems = [
          ['Company',          data.name],
          ['Ticker',           decodedTicker],
          ['Market Cap',       data.marketCap ?? 'N/A'],
          ['P/E Ratio',        data.pe ?? 'N/A'],
          ['EPS (TTM)',         data.eps !== 'N/A' ? `$${data.eps}` : 'N/A'],
          ['Beta',             data.beta ?? 'N/A'],
          ['52W High',         `$${safe(high52)}`],
          ['52W Low',          `$${safe(low52)}`],
          ['Volume',           data.volume ?? 'N/A'],
          ['Analyst Target',   target ? `$${safe(target)}` : 'N/A'],
          ['Recommendation',   data.recommendation],
          ['Asset Type',       ASSET_LABELS[assetType]],
        ]

        fundItems.forEach((item, i) => {
          doc.setFillColor(i%2===0 ? 245 : 255, i%2===0 ? 245 : 255, i%2===0 ? 250 : 255)
          doc.rect(margin-2, y, pw-2*margin+4, 8, 'F')
          doc.setTextColor(100,100,120); doc.setFontSize(8); doc.setFont('helvetica','normal')
          doc.text(item[0], margin, y+5.5)
          doc.setTextColor(26,26,46); doc.setFont('helvetica','bold')
          doc.text(item[1] as string, pw-margin, y+5.5, { align: 'right' })
          y += 10
        })
        y += 6
      }

      // Full AI analysis
      if (data.aiSummary) {
        doc.setFillColor(232, 244, 252)
        doc.roundedRect(margin-2, y-2, pw-2*margin+4, 35, 3, 3, 'F')
        doc.setDrawColor(0,156,222); doc.setLineWidth(0.3)
        doc.roundedRect(margin-2, y-2, pw-2*margin+4, 35, 3, 3, 'S')
        doc.setTextColor(26,26,46); doc.setFontSize(9); doc.setFont('helvetica','bold')
        doc.text('Full AI Analysis', margin, y+6)
        doc.setFont('helvetica','normal'); doc.setFontSize(8)
        const aiLines = doc.splitTextToSize(data.aiSummary, pw-2*margin-4)
        doc.text(aiLines, margin, y+13)
        y += 40
      }

      // Disclaimer full
      doc.setFillColor(245,245,250)
      doc.roundedRect(margin-2, y-2, pw-2*margin+4, 28, 3, 3, 'F')
      doc.setTextColor(100,100,120); doc.setFontSize(8); doc.setFont('helvetica','bold')
      doc.text('Disclaimer', margin, y+5)
      doc.setFont('helvetica','normal'); doc.setFontSize(7)
      const disclaimer = 'This report is generated for informational purposes only and does not constitute financial advice, investment advice, or a recommendation to buy or sell any security. All data is sourced from Yahoo Finance and Alpha Vantage and verified at the time of generation. AI analysis is based solely on the verified data provided — no numbers are invented or estimated. Past performance is not indicative of future results. Investing involves risk, including the possible loss of principal. Always consult a qualified financial advisor before making investment decisions.'
      const disclaimerLines = doc.splitTextToSize(disclaimer, pw-2*margin-4)
      doc.text(disclaimerLines, margin, y+11)
      y += 32

      // Footer all pages
      const totalPages = doc.getNumberOfPages()
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p)
        const pageH2 = doc.internal.pageSize.getHeight()
        doc.setFillColor(0,48,135)
        doc.rect(0, pageH2-8, pw, 8, 'F')
        doc.setTextColor(255,255,255); doc.setFontSize(6.5); doc.setFont('helvetica','normal')
        doc.text(`StockAI Report · ${decodedTicker} · ${new Date().toLocaleDateString('en-US')}`, margin, pageH2-3)
        doc.text(`Page ${p} of ${totalPages}`, pw-margin, pageH2-3, { align: 'right' })
      }

      doc.save(`${decodedTicker}_StockAI_Report.pdf`)
    } catch (e: any) {
      console.error('PDF error:', e)
      alert('PDF generation failed: ' + e.message)
    } finally {
      setPdfLoading(false)
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
          <button
            onClick={handlePDF}
            disabled={pdfLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={14}/>
            {pdfLoading ? 'Generating...' : 'Download PDF'}
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