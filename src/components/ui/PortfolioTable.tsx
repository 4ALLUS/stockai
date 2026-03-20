'use client'
import Link from 'next/link'
import { clsx } from 'clsx'

const positions = [
  { ticker: 'NVDA', name: 'NVIDIA',    price: 875,  shares: 5,  cost: 620,  },
  { ticker: 'AAPL', name: 'Apple',     price: 172,  shares: 20, cost: 154,  },
  { ticker: 'PYPL', name: 'PayPal',    price: 48,   shares: 50, cost: 62,   },
  { ticker: 'MSFT', name: 'Microsoft', price: 415,  shares: 8,  cost: 384,  },
]

export function PortfolioTable() {
  return (
    <div className="card">
      <p className="text-sm font-medium text-gray-500 mb-4">Positions</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2 w-20">Ticker</th>
              <th className="text-left pb-2">Name</th>
              <th className="text-right pb-2 w-20">Price</th>
              <th className="text-right pb-2 w-16">Shares</th>
              <th className="text-right pb-2 w-24">Value</th>
              <th className="text-right pb-2 w-20">Return</th>
              <th className="text-right pb-2 w-16">P&amp;L %</th>
            </tr>
          </thead>
          <tbody>
            {positions.map(p => {
              const value  = p.price * p.shares
              const cost   = p.cost  * p.shares
              const pnl    = value - cost
              const pnlPct = ((p.price - p.cost) / p.cost) * 100
              const pos    = pnl >= 0
              return (
                <tr key={p.ticker} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="py-2.5">
                    <Link href={`/search/${p.ticker}`}>
                      <span className="badge badge-blue">{p.ticker}</span>
                    </Link>
                  </td>
                  <td className="py-2.5 text-gray-700">{p.name}</td>
                  <td className="py-2.5 text-right font-medium">${p.price}</td>
                  <td className="py-2.5 text-right text-gray-500">{p.shares}</td>
                  <td className="py-2.5 text-right font-medium">${value.toLocaleString()}</td>
                  <td className={clsx('py-2.5 text-right font-medium', pos ? 'text-green-600' : 'text-red-600')}>
                    {pos ? '+' : ''}${pnl.toLocaleString()}
                  </td>
                  <td className={clsx('py-2.5 text-right', pos ? 'text-green-600' : 'text-red-600')}>
                    {pos ? '+' : ''}{pnlPct.toFixed(1)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 p-4 bg-brand-50 rounded-xl border border-brand-100">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-medium text-brand-800">AI portfolio health check</p>
          <span className="badge badge-blue text-[10px]">verified data</span>
        </div>
        <p className="text-sm text-brand-800 leading-relaxed">
          Concentration risk: 17% in NVDA (high beta 1.6). PYPL position underwater — analyst consensus still Buy (+73% upside target). Consider rebalancing tech exposure. Diversification score: 6.2/10.
        </p>
      </div>
    </div>
  )
}
