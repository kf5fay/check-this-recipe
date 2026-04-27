import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Recipe } from '@/types'
import { ServingsSelector } from '@/components/recipe/ServingsSelector'

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { id } = await params
  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (!recipe) notFound()

  const r = recipe as Recipe
  const isOwner = r.owner_id === user.id

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {r.status === 'draft' && (
        <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
          This recipe is missing ingredients or instructions —{' '}
          <Link href={`/recipes/${r.id}/edit`} className="font-medium underline">
            tap to complete it
          </Link>
          .
        </div>
      )}

      {/* Cover image */}
      {(r.original_image_url || r.uploaded_image_path) && (
        <div className="mb-8 rounded-xl overflow-hidden aspect-video bg-cream-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={r.original_image_url ?? r.uploaded_image_path ?? ''}
            alt={r.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">{r.title}</h1>
          {r.description && (
            <p className="mt-2 text-stone-500">{r.description}</p>
          )}
          {r.source_url && (
            <a
              href={r.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-terracotta-600 hover:text-terracotta-700 underline"
            >
              View original source ↗
            </a>
          )}
        </div>

        {isOwner && (
          <div className="flex gap-2 flex-shrink-0">
            <Link href={`/recipes/${r.id}/edit`} className="btn-secondary text-xs">
              Edit
            </Link>
            <Link href={`/recipes/${r.id}/share`} className="btn-secondary text-xs">
              Share
            </Link>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-4 mb-8 text-sm text-stone-500">
        {r.prep_time_minutes && (
          <span>Prep: <strong className="text-stone-700">{r.prep_time_minutes} min</strong></span>
        )}
        {r.cook_time_minutes && (
          <span>Cook: <strong className="text-stone-700">{r.cook_time_minutes} min</strong></span>
        )}
        {r.prep_time_minutes && r.cook_time_minutes && (
          <span>Total: <strong className="text-stone-700">{r.prep_time_minutes + r.cook_time_minutes} min</strong></span>
        )}
      </div>

      {/* Servings selector */}
      {r.status === 'complete' && (
        <ServingsSelector defaultServings={r.servings} ingredients={r.ingredients} />
      )}

      {/* Tags */}
      {r.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6">
          {r.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full bg-sage-100 text-sage-700 text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Instructions */}
      {r.instructions.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-stone-800 mb-4">Instructions</h2>
          <ol className="space-y-4">
            {r.instructions.map((step) => (
              <li key={step.step_number} className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-terracotta-100 text-terracotta-700 text-sm font-semibold flex items-center justify-center">
                  {step.step_number}
                </span>
                <p className="text-stone-700 pt-0.5">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Add to meal plan */}
      {r.status === 'complete' && (
        <div className="mt-10 pt-8 border-t border-stone-200">
          <Link href={`/meal-plan?add=${r.id}`} className="btn-primary">
            Add to Meal Plan
          </Link>
        </div>
      )}
    </div>
  )
}
