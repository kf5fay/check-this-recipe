'use client'

import { useState } from 'react'

export function AddFriendForm() {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: value }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('sent')
        setMessage(data.message ?? 'Friend request sent!')
        setValue('')
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Could not send request.')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={value}
        onChange={(e) => { setValue(e.target.value); setStatus('idle') }}
        placeholder="Email address or phone number"
        required
        className="input"
      />
      {status === 'sent' && <p className="text-sm text-sage-700">{message}</p>}
      {status === 'error' && <p className="text-sm text-red-600">{message}</p>}
      <button type="submit" disabled={status === 'loading'} className="btn-primary">
        {status === 'loading' ? 'Sending…' : 'Send Friend Request'}
      </button>
    </form>
  )
}
