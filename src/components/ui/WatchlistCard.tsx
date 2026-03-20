'use client'
import Link from 'next/link'
import { clsx } from 'clsx'

const stocks = [
  { ticker: 'NVDA', name: 'NVIDIA',    price: '$875.40', change: '+2.8%',  pos: true },
  { ticker: 'AAPL', name: 'Apple',     price: '$172.30', change: '-0.4%',  pos: false },
  { ticker: 'PYPL', name: 'PayPal',    price: '$48.92',  change: '+1.1%',  pos: true },
  { ticker: 'MSFT', name: 'Microsoft', price: '$415.20', change: '+0.6%',  pos: true },
]

export function WatchlistCard() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">Top movers — watchlist</p>
        <Link href="/portfolio" className="text-xs text-brand-600 hover:underline">View all</Link>
      </div>
      {stocks.map(s => (
        <Link
          key={s.ticker}
          href={`/search/${s.ticker}`}
          className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
        >
          <span className="badge badge-blue w-12 justify-center">{s.ticker}</span>
          <span className="text-sm text-gray-700 flex-1">{s.name}</span>
          <span className="text-sm font-medium text-gray-900">{s.price}</span>
          <span className={clsx('text-xs w-12 text-right', s.pos ? 'text-green-600' : 'text-red-600')}>
            {s.change}
          </span>
        </Link>
      ))}
    </div>
  )
}
