import Link from 'next/link'
import { Check, X } from 'lucide-react'

const plans = [
  {
    name: 'Free Trial',
    price: '$0',
    period: '3 days · no card needed',
    badge: null,
    featured: false,
    features: [
      { text: '5 stock reports',     included: true },
      { text: 'AI summary',          included: true },
      { text: 'Basic sentiment',     included: true },
      { text: 'PDF export',          included: false },
      { text: 'Portfolio tracker',   included: false },
      { text: 'Price alerts',        included: false },
    ],
    cta: 'Current plan',
    href: '/signup',
    primary: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    badge: 'Most popular',
    featured: true,
    features: [
      { text: 'Unlimited AI reports', included: true },
      { text: 'Full AI analysis',     included: true },
      { text: 'PDF export',           included: true },
      { text: 'Portfolio tracker',    included: true },
      { text: 'Price alerts',         included: true },
      { text: 'Quant projections',    included: true },
    ],
    cta: 'Upgrade to Pro',
    href: '/checkout',
    primary: true,
  },
  {
    name: 'Annual',
    price: '$149',
    period: 'per year · save 35%',
    badge: null,
    featured: false,
    features: [
      { text: 'Everything in Pro',   included: true },
      { text: 'Priority support',    included: true },
      { text: 'API access (beta)',   included: true },
      { text: 'Custom watchlists',   included: true },
      { text: 'Early features',      included: true },
      { text: 'Team sharing',        included: true },
    ],
    cta: 'Get Annual',
    href: '/checkout?plan=annual',
    primary: false,
  },
]

export function PricingCards() {
  return (
    <div className="grid grid-cols-3 gap-5 max-w-3xl mx-auto">
      {plans.map(plan => (
        <div
          key={plan.name}
          className={`bg-white rounded-2xl p-6 flex flex-col ${
            plan.featured
              ? 'border-2 border-brand-400'
              : 'border border-gray-200'
          }`}
        >
          {plan.badge && (
            <span className="badge badge-blue text-[11px] mb-3 self-start">{plan.badge}</span>
          )}
          <h2 className="text-base font-medium text-gray-900 mb-1">{plan.name}</h2>
          <div className="flex items-baseline gap-1 mb-0.5">
            <span className="text-3xl font-medium text-gray-900">{plan.price}</span>
          </div>
          <p className="text-xs text-gray-400 mb-5">{plan.period}</p>

          <ul className="space-y-2.5 flex-1 mb-6">
            {plan.features.map(f => (
              <li key={f.text} className="flex items-center gap-2 text-sm">
                {f.included
                  ? <Check size={13} className="text-green-600 flex-shrink-0" />
                  : <X     size={13} className="text-red-400   flex-shrink-0" />
                }
                <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
              </li>
            ))}
          </ul>

          <Link
            href={plan.href}
            className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
              plan.primary
                ? 'bg-brand text-white hover:bg-brand-600'
                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {plan.cta}
          </Link>
        </div>
      ))}
    </div>
  )
}
