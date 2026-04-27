import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const hasIngredients = Array.isArray(body.ingredients) && body.ingredients.length > 0
  const hasInstructions = Array.isArray(body.instructions) && body.instructions.length > 0
  const status = hasIngredients && hasInstructions ? 'complete' : 'draft'

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      owner_id: user.id,
      title: body.title,
      description: body.description || null,
      source_url: body.source_url || null,
      source_type: body.source_type ?? 'manual',
      status,
      servings: body.servings ?? 2,
      prep_time_minutes: body.prep_time_minutes || null,
      cook_time_minutes: body.cook_time_minutes || null,
      ingredients: body.ingredients ?? [],
      instructions: body.instructions ?? [],
      tags: body.tags ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
