'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Search, TrendingUp, CreditCard, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/search',    label: 'Stock Search', icon: Search },
  { href: '/portfolio', label: 'Portfolio',    icon: TrendingUp },
  { href: '/pricing',   label: 'Pricing',      icon: CreditCard },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/signup')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col py-4 px-3">
        {/* Logo placeholder */}
        <div className="flex items-center gap-2.5 px-2 pb-4 mb-3 border-b border-gray-100">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white text-sm font-medium">
            AI
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">StockAI</div>
            <div className="text-[10px] text-gray-400">logo TBD</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          <p className="text-[10px] text-gray-400 px-2 pt-1 pb-1 uppercase tracking-wide">Main</p>
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors',
                path.startsWith(href)
                  ? 'bg-brand-50 text-brand-800 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Trial badge */}
        <div className="mt-auto">
          <div className="bg-amber-50 text-amber-800 text-[11px] text-center py-1.5 px-2 rounded-lg mb-3">
            Trial: 1 days left
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-2.5 py-2 text-sm text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors w-full"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}
