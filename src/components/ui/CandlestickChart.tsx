'use client'
import { useEffect, useRef } from 'react'

interface HistoryPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export default function CandlestickChart({ history }: { history: HistoryPoint[] }) {
  const chartRef      = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<any>(null)

  useEffect(() => {
    if (!chartRef.current || !history.length) return
    let cancelled = false

    const init = async () => {
      try {
        const LW = await import('lightweight-charts')
        if (cancelled || !chartRef.current) return

        if (chartInstance.current) {
          try { chartInstance.current.remove() } catch {}
          chartInstance.current = null
        }

        const isDark    = window.matchMedia('(prefers-color-scheme: dark)').matches
        const textColor = isDark ? '#888' : '#999'
        const gridColor = isDark ? '#2a2a2a' : '#f0f0f0'

        // v5 API
        const chart = LW.createChart(chartRef.current, {
          width:  chartRef.current.clientWidth,
          height: 300,
          layout: {
            background: { type: LW.ColorType.Solid, color: 'transparent' },
            textColor,
          },
          grid: {
            vertLines: { color: gridColor },
            horzLines: { color: gridColor },
          },
          rightPriceScale: { borderVisible: false },
          timeScale:       { borderVisible: false },
          handleScroll: true,
          handleScale:  true,
        })

        chartInstance.current = chart

        // v5: usare createSeriesMarkers o CandlestickSeries class
        const candleSeries = chart.addSeries(LW.CandlestickSeries, {
          upColor:         '#22c55e',
          downColor:       '#ef4444',
          borderUpColor:   '#22c55e',
          borderDownColor: '#ef4444',
          wickUpColor:     '#22c55e',
          wickDownColor:   '#ef4444',
        })

        const candleData = history
          .filter(h => h.open && h.high && h.low && h.close && h.date)
          .map(h => ({ time: h.date as any, open: h.open, high: h.high, low: h.low, close: h.close }))

        if (candleData.length > 0) candleSeries.setData(candleData)

        // MA50
        const ma50Data: any[] = []
        for (let i = 49; i < history.length; i++) {
          const slice = history.slice(i - 49, i + 1).map(x => x.close).filter(Boolean)
          if (slice.length === 50) {
            ma50Data.push({ time: history[i].date as any, value: parseFloat((slice.reduce((a,b)=>a+b,0)/50).toFixed(4)) })
          }
        }
        if (ma50Data.length > 0) {
          const ma50Series = chart.addSeries(LW.LineSeries, {
            color: '#f59e0b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false
          })
          ma50Series.setData(ma50Data)
        }

        // MA200
        const ma200Data: any[] = []
        for (let i = 199; i < history.length; i++) {
          const slice = history.slice(i - 199, i + 1).map(x => x.close).filter(Boolean)
          if (slice.length === 200) {
            ma200Data.push({ time: history[i].date as any, value: parseFloat((slice.reduce((a,b)=>a+b,0)/200).toFixed(4)) })
          }
        }
        if (ma200Data.length > 0) {
          const ma200Series = chart.addSeries(LW.LineSeries, {
            color: '#ef4444', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false
          })
          ma200Series.setData(ma200Data)
        }

        // Volume
        const volSeries = chart.addSeries(LW.HistogramSeries, {
          color: '#e5e7eb',
          priceFormat: { type: 'volume' as any },
          priceScaleId: 'vol',
        })
        chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
        const volData = history
          .filter(h => h.volume != null && h.date)
          .map(h => ({ time: h.date as any, value: h.volume, color: h.close >= h.open ? '#bbf7d0' : '#fecaca' }))
        if (volData.length > 0) volSeries.setData(volData)

        chart.timeScale().fitContent()

        const ro = new ResizeObserver(() => {
          if (chartRef.current && chartInstance.current) {
            chartInstance.current.applyOptions({ width: chartRef.current.clientWidth })
          }
        })
        ro.observe(chartRef.current)

      } catch (e) {
        console.error('Chart error:', e)
      }
    }

    init()

    return () => {
      cancelled = true
      if (chartInstance.current) {
        try { chartInstance.current.remove() } catch {}
        chartInstance.current = null
      }
    }
  }, [history])

  return (
    <div>
      <div className="flex items-center gap-4 mb-2 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-green-500 inline-block rounded-sm"></span>Bullish</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-red-500 inline-block rounded-sm"></span>Bearish</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-amber-400 border-dashed inline-block"></span>MA50</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-red-400 border-dashed inline-block"></span>MA200</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-gray-200 inline-block rounded-sm"></span>Volume</span>
      </div>
      <div ref={chartRef} style={{ width: '100%', height: 300 }} />
    </div>
  )
}