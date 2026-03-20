import AppLayout from '@/components/layout/AppLayout'
import { StockReport } from '@/components/ui/StockReport'

interface Props {
  params: { ticker: string }
}

export default function StockDetailPage({ params }: Props) {
  return (
    <AppLayout>
      <StockReport ticker={params.ticker.toUpperCase()} />
    </AppLayout>
  )
}
