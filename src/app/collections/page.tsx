import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Collection } from '@/types'

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: collections } = await supabase
    .from('collections')
    .select('*, members:collection_members(count)')
    .or(`owner_id.eq.${user.id},collection_members.user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Collections</h1>
        <Link href="/collections/new" className="btn-primary">
          + New Collection
        </Link>
      </div>

      {collections && collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {collections.map((col: Collection) => (
            <Link
              key={col.id}
              href={`/collections/${col.id}`}
              className="card p-5 hover:ring-terracotta-300 hover:ring-2 transition-all"
            >
              <h3 className="font-semibold text-stone-800 text-lg">{col.name}</h3>
              <p className="text-sm text-stone-400 mt-1">
                Created {new Date(col.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-lg font-medium text-stone-700 mb-2">No collections yet</h2>
          <p className="text-stone-400 text-sm mb-6">
            Create a shared cookbook with friends — holiday recipes, dinner party favorites, and more.
          </p>
          <Link href="/collections/new" className="btn-primary">
            Create a collection
          </Link>
        </div>
      )}
    </div>
  )
}
