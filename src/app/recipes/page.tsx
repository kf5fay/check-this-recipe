import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import type { Recipe } from '@/types'

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; status?: string; source?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const params = await searchParams
  const { q, tag, status, source } = params

  let query = supabase
    .from('recipes')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (q) query = query.ilike('title', `%${q}%`)
  if (tag) query = query.contains('tags', [tag])
  if (status) query = query.eq('status', status)
  if (source) query = query.eq('source_type', source)

  const { data: recipes } = await query

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-stone-800">My Recipes</h1>
        <Link href="/recipes/new" className="btn-primary">
          + Add Recipe
        </Link>
      </div>

      {/* Search & filters */}
      <form className="mb-8 flex flex-col sm:flex-row gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search recipes or ingredients…"
          className="input flex-1"
        />
        <select name="status" defaultValue={status} className="input w-full sm:w-40">
          <option value="">All statuses</option>
          <option value="complete">Complete</option>
          <option value="draft">Draft</option>
        </select>
        <select name="source" defaultValue={source} className="input w-full sm:w-44">
          <option value="">All sources</option>
          <option value="web_url">Web URL</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
          <option value="photo">Photo</option>
          <option value="manual">Manual</option>
        </select>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map((recipe: Recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">📖</div>
          <h2 className="text-lg font-medium text-stone-700 mb-2">No recipes yet</h2>
          <p className="text-stone-400 mb-6 text-sm">
            Save a recipe from a URL, upload a photo, or enter one manually.
          </p>
          <Link href="/recipes/new" className="btn-primary">
            Add your first recipe
          </Link>
        </div>
      )}
    </div>
  )
}
