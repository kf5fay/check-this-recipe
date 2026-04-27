'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const NAV_LINKS = [
  { href: '/recipes', label: 'Recipes' },
  { href: '/shared', label: 'Shared' },
  { href: '/meal-plan', label: 'Meal Plan' },
  { href: '/collections', label: 'Collections' },
  { href: '/friends', label: 'Friends' },
]

export function Navbar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/recipes" className="font-bold text-terracotta-600 text-lg">
            🍳 Check This Recipe
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? 'bg-terracotta-50 text-terracotta-700'
                    : 'text-stone-600 hover:bg-cream-200 hover:text-stone-800'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/settings" className="btn-ghost text-xs hidden sm:inline-flex">
            {user.email}
          </Link>
          <button onClick={handleSignOut} className="btn-secondary text-xs">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
