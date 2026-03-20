import { clsx } from 'clsx'

interface Props {
  label: string
  value: string
  sub?: string
  subColor?: 'green' | 'amber' | 'red' | 'default'
}

const subColors = {
  green:   'text-green-600',
  amber:   'text-amber-600',
  red:     'text-red-600',
  default: 'text-gray-400',
}

export function MetricCard({ label, value, sub, subColor = 'default' }: Props) {
  return (
    <div className="bg-gray-50 rounded-xl p-3.5">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-medium text-gray-900">{value}</p>
      {sub && <p className={clsx('text-xs mt-0.5', subColors[subColor])}>{sub}</p>}
    </div>
  )
}
