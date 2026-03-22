'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center text-white text-xl font-medium mx-auto mb-3">
            AI
          </div>
          <h1 className="text-lg font-medium text-gray-900">Sign in</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome back</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="marco@email.com" required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <button onClick={handleGoogle} className="btn-secondary w-full py-2.5 mt-3">
          Continue with Google
        </button>
        <p className="text-center text-xs text-gray-400 mt-4">
          No account?{' '}
          <Link href="/signup" className="text-brand-600 hover:underline">Start free trial</Link>
        </p>
      </div>
    </div>
  )
}