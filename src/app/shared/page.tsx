import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { SharedRecipe } from '@/types'

export default async function SharedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: shared } = await supabase
    .from('shared_recipes')
    .select('*, recipe:recipes(*), sender:profiles!sender_id(*)')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-8">Shared With Me</h1>

      {shared && shared.length > 0 ? (
        <div className="space-y-4">
          {shared.map((item: SharedRecipe) => (
            <div key={item.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-500 mb-1">
                    From <strong className="text-stone-700">{item.sender?.display_name ?? 'a friend'}</strong>
                  </p>
                  <h3 className="font-semibold text-stone-800 truncate">
                    {item.recipe?.title ?? 'Untitled recipe'}
                  </h3>
                  {item.note && (
                    <p className="mt-1 text-sm text-stone-500 italic">&ldquo;{item.note}&rdquo;</p>
                  )}
                  <p className="mt-1 text-xs text-stone-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/recipes/${item.recipe_id}`} className="btn-secondary text-xs">
                    View
                  </Link>
                  <form action={`/api/shared/${item.id}/save`} method="POST">
                    <button type="submit" className="btn-primary text-xs">
                      Save
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">💌</div>
          <h2 className="text-lg font-medium text-stone-700 mb-2">Nothing here yet</h2>
          <p className="text-stone-400 text-sm">
            When a friend shares a recipe with you, it will appear here.
          </p>
        </div>
      )}
    </div>
  )
}
