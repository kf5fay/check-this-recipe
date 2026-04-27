import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RecipeForm } from '@/components/recipe/RecipeForm'

export default async function NewRecipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-8">Add a Recipe</h1>
      <RecipeForm />
    </div>
  )
}
