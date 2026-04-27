'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function SettingsForm({ user, profile }: { user: User; profile: { display_name?: string; avatar_url?: string } | null }) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, display_name: displayName, updated_at: new Date().toISOString() })

    if (error) {
      setStatus('error')
    } else {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="label">Email</label>
        <input value={user.email ?? ''} readOnly className="input bg-cream-50 text-stone-400 cursor-not-allowed" />
      </div>

      <div>
        <label className="label">Display Name</label>
        <input
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setStatus('idle') }}
          placeholder="Your name"
          className="input"
          required
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600">Could not save. Please try again.</p>
      )}
      {status === 'saved' && (
        <p className="text-sm text-sage-700">Saved!</p>
      )}

      <button type="submit" disabled={status === 'saving'} className="btn-primary">
        {status === 'saving' ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
