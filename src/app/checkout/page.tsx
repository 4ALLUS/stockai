'use client'
import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Lock } from 'lucide-react'

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'pro_monthly' }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setLoading(false)
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Upgrade to Pro</h1>
        <p className="text-sm text-gray-400 mt-0.5">Secure checkout · powered by Stripe</p>
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-5">
        <div className="card">
          <h2 className="text-sm font-medium text-gray-500 mb-4">Payment details</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name on card</label>
              <input className="input" placeholder="Marco Rossi" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input className="input" type="email" placeholder="marco@email.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Card number</label>
              <input className="input" placeholder="1234 5678 9012 3456" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Expiry</label>
                <input className="input" placeholder="MM/YY" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">CVC</label>
                <input className="input" placeholder="123" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
            <Lock size={11} />
            Secured by Stripe · 256-bit SSL
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="btn-primary w-full py-3 mt-5 text-base"
          >
            {loading ? 'Redirecting to Stripe...' : 'Pay $19.00 / month'}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            You will be redirected to Stripe's secure payment page
          </p>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="text-sm font-medium text-gray-500 mb-3">Order summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">StockAI Pro</span><span>$19.00</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Billing</span><span>Monthly</span></div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-medium">
                <span>Total</span><span>$19.00/mo</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Cancel anytime. No hidden fees.</p>
          </div>
          <div className="card">
            <h2 className="text-sm font-medium text-gray-500 mb-3">What you unlock</h2>
            <ul className="space-y-1.5 text-sm text-gray-600">
              {['Unlimited AI reports', 'PDF export', 'Portfolio tracker', 'Quant projections', 'Price alerts'].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-green-600 text-xs">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
