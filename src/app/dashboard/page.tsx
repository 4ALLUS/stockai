import AppLayout from '@/components/layout/AppLayout'
import { MetricCard } from '@/components/ui/MetricCard'
import { WatchlistCard } from '@/components/ui/WatchlistCard'
import { AiSummaryCard } from '@/components/ui/AiSummaryCard'

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Good morning</h1>
          <p className="text-sm text-gray-400 mt-0.5">Your portfolio overview · real-time data</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-amber">Trial: 3 days left</span>
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-sm font-medium">M</div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <MetricCard label="Portfolio value"  value="$24,810"  sub="+$312 today"  subColor="green" />
        <MetricCard label="Day gain"         value="+1.27%"   sub="vs S&P +0.41%" subColor="green" />
        <MetricCard label="Open positions"   value="7"        sub="4 on watchlist" />
        <MetricCard label="AI alerts"        value="3"        sub="2 new signals"  subColor="amber" />
      </div>

      {/* Two-column row */}
      <div className="grid grid-cols-2 gap-4">
        <WatchlistCard />
        <AiSummaryCard />
      </div>
    </AppLayout>
  )
}
