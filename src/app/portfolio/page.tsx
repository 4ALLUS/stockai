import AppLayout from '@/components/layout/AppLayout'
import { PortfolioTable } from '@/components/ui/PortfolioTable'
import { MetricCard } from '@/components/ui/MetricCard'

export default function PortfolioPage() {
  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">My Portfolio</h1>
          <p className="text-sm text-gray-400 mt-0.5">Real-time P&amp;L · AI health check</p>
        </div>
        <button className="btn-primary">+ Add position</button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total invested" value="$21,400" />
        <MetricCard label="Current value"  value="$24,810" />
        <MetricCard label="Total return"   value="+$3,410" subColor="green" />
        <MetricCard label="Return %"       value="+15.9%"  subColor="green" />
      </div>

      <PortfolioTable />
    </AppLayout>
  )
}
