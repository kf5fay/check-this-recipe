import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AddFriendForm } from '@/components/friends/AddFriendForm'
import type { Friendship } from '@/types'

export default async function FriendsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: sent }, { data: received }] = await Promise.all([
    supabase
      .from('friendships')
      .select('*, addressee:profiles!addressee_id(*)')
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('friendships')
      .select('*, requester:profiles!requester_id(*)')
      .eq('addressee_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const friends = [
    ...(sent ?? []).filter((f: Friendship) => f.status === 'accepted'),
    ...(received ?? []).filter((f: Friendship) => f.status === 'accepted'),
  ]
  const pendingSent = (sent ?? []).filter((f: Friendship) => f.status === 'pending')
  const pendingReceived = (received ?? []).filter((f: Friendship) => f.status === 'pending')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-8">Friends</h1>

      <div className="card p-5 mb-8">
        <h2 className="text-base font-semibold text-stone-700 mb-4">Add a Friend</h2>
        <AddFriendForm />
      </div>

      {pendingReceived.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-stone-700 mb-3">
            Pending Requests ({pendingReceived.length})
          </h2>
          <div className="space-y-3">
            {pendingReceived.map((f: Friendship) => (
              <div key={f.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-800">{f.requester?.display_name}</p>
                  <p className="text-xs text-stone-400">{f.requester?.email}</p>
                </div>
                <div className="flex gap-2">
                  <form action={`/api/friends/${f.id}/accept`} method="POST">
                    <button type="submit" className="btn-primary text-xs">Accept</button>
                  </form>
                  <form action={`/api/friends/${f.id}/decline`} method="POST">
                    <button type="submit" className="btn-secondary text-xs">Decline</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-base font-semibold text-stone-700 mb-3">
          Friends ({friends.length})
        </h2>
        {friends.length > 0 ? (
          <div className="space-y-3">
            {friends.map((f: Friendship) => {
              const friend = f.requester_id === user.id ? f.addressee : f.requester
              return (
                <div key={f.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-800">{friend?.display_name}</p>
                    <p className="text-xs text-stone-400">{friend?.email}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-stone-400 text-sm">No friends yet — invite someone!</p>
        )}
      </section>

      {pendingSent.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-stone-700 mb-3">
            Sent Requests ({pendingSent.length})
          </h2>
          <div className="space-y-3">
            {pendingSent.map((f: Friendship) => (
              <div key={f.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-800">{f.addressee?.display_name ?? f.addressee?.email}</p>
                  <p className="text-xs text-stone-400">Waiting for response</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
