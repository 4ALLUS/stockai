
'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { Search } from 'lucide-react'

interface Suggestion {
  symbol: string
  name: string
  exchDisp: string
  typeDisp: string
}

export default function SearchPage() {
  const [query, setQuery]           = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading]       = useState(false)
  const [showDrop, setShowDrop]     = useState(false)
  const router  = useRouter()
  const debounce = useRef<any>(null)

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); setShowDrop(false); return }
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(data.suggestions ?? [])
        setShowDrop(true)
      } catch { setSuggestions([]) }
      setLoading(false)
    }, 300)
  }, [query])

  const handleSelect = (symbol: string) => {
    setShowDrop(false)
    setQuery(symbol)
    router.push(`/search/${symbol}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/search/${query.trim().toUpperCase()}`)
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Stock Search</h1>
        <p className="text-sm text-gray-400 mt-0.5">Type a name or ticker — AI report in seconds</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
          <input
            className="input pl-9 w-full"
            placeholder="e.g. Apple, Bitcoin, Recursion Pharma..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDrop(true)}
            onBlur={() => setTimeout(() => setShowDrop(false), 200)}
            autoFocus
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
            </div>
          )}
          {showDrop && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {suggestions.map(s => (
                <button
                  key={s.symbol}
                  type="button"
                  onMouseDown={() => handleSelect(s.symbol)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                >
                  <span className="badge badge-blue w-16 justify-center text-center flex-shrink-0">{s.symbol}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.exchDisp} · {s.typeDisp}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="btn-primary px-6">Analyze</button>
      </form>

      <div>
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Popular searches</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { symbol: 'AAPL',    label: 'Apple' },
            { symbol: 'NVDA',    label: 'NVIDIA' },
            { symbol: 'BTC-USD', label: 'Bitcoin' },
            { symbol: 'TSLA',    label: 'Tesla' },
            { symbol: 'MSFT',    label: 'Microsoft' },
            { symbol: 'RXRX',    label: 'Recursion' },
            { symbol: 'ETH-USD', label: 'Ethereum' },
            { symbol: 'PYPL',    label: 'PayPal' },
          ].map(t => (
            <button
              key={t.symbol}
              onClick={() => handleSelect(t.symbol)}
              className="badge badge-blue cursor-pointer hover:bg-brand-100 transition-colors py-1.5 px-3"
            >
              {t.label} · {t.symbol}
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}