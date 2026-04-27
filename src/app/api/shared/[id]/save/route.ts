import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Recipe } from '@/types'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: shared, error: fetchError } = await supabase
    .from('shared_recipes')
    .select('*, recipe:recipes(*)')
    .eq('id', id)
    .eq('recipient_id', user.id)
    .single()

  if (fetchError || !shared) {
    return NextResponse.json({ error: 'Shared recipe not found' }, { status: 404 })
  }

  const original = shared.recipe as Recipe

  // Clone the recipe for the recipient
  const { data: cloned, error: cloneError } = await supabase
    .from('recipes')
    .insert({
      owner_id: user.id,
      title: original.title,
      description: original.description,
      source_url: original.source_url,
      source_type: original.source_type,
      original_image_url: original.original_image_url,
      status: original.status,
      servings: original.servings,
      prep_time_minutes: original.prep_time_minutes,
      cook_time_minutes: original.cook_time_minutes,
      ingredients: original.ingredients,
      instructions: original.instructions,
      tags: original.tags,
    })
    .select()
    .single()

  if (cloneError) return NextResponse.json({ error: cloneError.message }, { status: 500 })

  return NextResponse.redirect(new URL(`/recipes/${cloned.id}`, process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:3000'))
}
