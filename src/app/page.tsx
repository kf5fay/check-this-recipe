'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (error) {
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-6">📬</div>
          <h2 className="text-2xl font-semibold text-stone-800 mb-2">Check your email</h2>
          <p className="text-stone-500">
            We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-6 text-sm text-terracotta-600 hover:text-terracotta-700 underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="mx-auto w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="text-6xl mb-4">🍳</div>
            <h1 className="text-3xl font-bold text-stone-800">Check This Recipe</h1>
            <p className="mt-2 text-stone-500 text-sm">
              Save recipes, plan meals, and share with friends.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input"
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !email}
              className="btn-primary w-full"
            >
              {status === 'loading' ? 'Sending…' : 'Send magic link'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-stone-400">
            No password needed. We&apos;ll email you a link to sign in.
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:flex-1 bg-terracotta-100 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <p className="text-4xl font-serif text-terracotta-800 leading-snug">
            &ldquo;A shared recipe box for you and your people.&rdquo;
          </p>
          <p className="mt-6 text-terracotta-600 text-sm">
            Save recipes from anywhere. Plan your week. Build your collection together.
          </p>
        </div>
      </div>
    </div>
  )
}
