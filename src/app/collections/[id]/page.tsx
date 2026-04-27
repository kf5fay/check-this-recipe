import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import type { Recipe } from '@/types'

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { id } = await params

  const [{ data: collection }, { data: recipes }] = await Promise.all([
    supabase
      .from('collections')
      .select('*, members:collection_members(user:profiles(*))')
      .eq('id', id)
      .single(),
    supabase
      .from('collection_recipes')
      .select('recipe:recipes(*)')
      .eq('collection_id', id)
      .order('added_at', { ascending: false }),
  ])

  if (!collection) notFound()

  const collectionRecipes = (recipes ?? []).map((r: { recipe: Recipe }) => r.recipe).filter(Boolean)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-stone-800">{collection.name}</h1>
        {collection.owner_id === user.id && (
          <Link href={`/collections/${id}/invite`} className="btn-secondary text-sm">
            Invite Member
          </Link>
        )}
      </div>

      <p className="text-sm text-stone-400 mb-8">
        {collection.members?.length ?? 0} member{collection.members?.length !== 1 ? 's' : ''}
      </p>

      {collectionRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collectionRecipes.map((recipe: Recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🍽️</div>
          <h2 className="text-lg font-medium text-stone-700 mb-2">No recipes yet</h2>
          <p className="text-stone-400 text-sm">
            Add recipes to this collection from any recipe&apos;s detail page.
          </p>
        </div>
      )}
    </div>
  )
}
