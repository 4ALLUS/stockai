'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router  = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
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
        {/* Logo placeholder */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center text-white text-xl font-medium mx-auto mb-3">
            AI
          </div>
          <h1 className="text-lg font-medium text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-400 mt-1">Start your 3-day free trial</p>
        </div>

        {/* Trial banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center text-xs text-amber-800 mb-5">
          3 days free · then $19/month · cancel anytime
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Full name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Marco Rossi" required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="marco@email.com" required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" minLength={8} required />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1">
            {loading ? 'Creating account...' : 'Start free trial'}
          </button>
        </form>

        <button onClick={handleGoogle} className="btn-secondary w-full py-2.5 mt-3">
          Continue with Google
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
