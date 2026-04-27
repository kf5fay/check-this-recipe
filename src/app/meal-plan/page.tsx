import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MealPlanCalendar } from '@/components/meal-plan/MealPlanCalendar'

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export default async function MealPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const weekStart = getWeekStart(new Date())

  const [{ data: entries }, { data: recipes }] = await Promise.all([
    supabase
      .from('meal_plan_entries')
      .select('*, recipe:recipes(*)')
      .eq('user_id', user.id)
      .eq('week_start', weekStart),
    supabase
      .from('recipes')
      .select('id, title')
      .eq('owner_id', user.id)
      .eq('status', 'complete')
      .order('title'),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Meal Plan</h1>
        <Link href="/shopping-list" className="btn-primary">
          Generate Shopping List
        </Link>
      </div>

      <MealPlanCalendar
        weekStart={weekStart}
        entries={entries ?? []}
        recipes={recipes ?? []}
        userId={user.id}
      />
    </div>
  )
}
