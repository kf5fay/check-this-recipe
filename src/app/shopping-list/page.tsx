import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShoppingList } from '@/components/shopping/ShoppingList'
import { consolidateIngredients } from '@/lib/anthropic'
import type { MealPlanEntry } from '@/types'

const PANTRY_STAPLES = new Set([
  'salt', 'pepper', 'sugar', 'flour', 'baking powder', 'baking soda',
  'olive oil', 'vegetable oil', 'butter', 'soy sauce', 'vinegar',
  'hot sauce', 'garlic powder', 'onion powder',
])

function isStaple(item: string, amount: string): boolean {
  const normalized = item.toLowerCase()
  if (PANTRY_STAPLES.has(normalized)) return true
  // Small quantity threshold — under 2 tsp likely a pantry staple usage
  if (amount.includes('tsp') && parseFloat(amount) <= 2) return true
  return false
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export default async function ShoppingListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const weekStart = getWeekStart(new Date())

  const { data: entries } = await supabase
    .from('meal_plan_entries')
    .select('*, recipe:recipes(*)')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)

  const typedEntries = (entries ?? []) as MealPlanEntry[]

  if (typedEntries.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Shopping List</h1>
        <p className="text-stone-400 mb-6">
          No recipes on your meal plan this week. Add some to generate a shopping list.
        </p>
        <a href="/meal-plan" className="btn-primary">Go to Meal Plan</a>
      </div>
    )
  }

  const ingredientLists = typedEntries
    .filter((e) => e.recipe && e.recipe.ingredients?.length)
    .map((e) => ({
      recipe_title: e.recipe!.title,
      ingredients: e.recipe!.ingredients.map((ing) => ({
        amount: ing.amount,
        unit: ing.unit,
        item: ing.item,
      })),
    }))

  const consolidated = await consolidateIngredients(ingredientLists) ?? []

  const shoppingItems = consolidated.filter((i) => !isStaple(i.item, i.amount))
  const pantryItems = consolidated.filter((i) => isStaple(i.item, i.amount))

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Shopping List</h1>
      <p className="text-sm text-stone-400 mb-8">
        Week of {new Date(weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
      </p>
      <ShoppingList shoppingItems={shoppingItems} pantryItems={pantryItems} />
    </div>
  )
}
