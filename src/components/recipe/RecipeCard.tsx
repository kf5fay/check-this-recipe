import Link from 'next/link'
import type { Recipe } from '@/types'

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const hasImage = recipe.original_image_url || recipe.uploaded_image_path

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="card group overflow-hidden hover:ring-terracotta-300 hover:ring-2 transition-all"
    >
      <div className="aspect-[4/3] bg-cream-200 overflow-hidden">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.original_image_url ?? recipe.uploaded_image_path ?? ''}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-cream-400">
            🍽️
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-stone-800 line-clamp-2 leading-snug group-hover:text-terracotta-700 transition-colors">
            {recipe.title}
          </h3>
          {recipe.status === 'draft' && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 font-medium">
              Draft
            </span>
          )}
        </div>

        {recipe.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-sage-100 text-sage-700 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {recipe.status === 'complete' && (
          <div className="mt-3 flex items-center gap-3 text-xs text-stone-400">
            {recipe.prep_time_minutes && <span>{recipe.prep_time_minutes + (recipe.cook_time_minutes ?? 0)} min</span>}
            {recipe.servings && <span>{recipe.servings} servings</span>}
          </div>
        )}
      </div>
    </Link>
  )
}
