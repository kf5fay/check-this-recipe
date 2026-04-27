import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('meal_plan_entries')
    .insert({
      user_id: user.id,
      recipe_id: body.recipe_id,
      week_start: body.week_start,
      day_of_week: body.day_of_week,
      meal_slot: body.meal_slot,
      servings: body.servings ?? 2,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
