import AppLayout from '@/components/layout/AppLayout'
import { PricingCards } from '@/components/ui/PricingCards'

export default function PricingPage() {
  return (
    <AppLayout>
      <div className="text-center mb-8">
        <h1 className="text-xl font-medium text-gray-900">Choose your plan</h1>
        <p className="text-sm text-gray-400 mt-1">Start free · no credit card required for trial</p>
      </div>
      <PricingCards />
      <p className="text-center text-xs text-gray-400 mt-6">
        Cancel anytime · Secure payment via Stripe · GDPR compliant
      </p>
    </AppLayout>
  )
}
