'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ParsedRecipeJSON, Ingredient, Instruction } from '@/types'

type Tab = 'url' | 'photo' | 'manual'

export function RecipeForm() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('url')
  const [url, setUrl] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedRecipeJSON | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleUrlParse(e: React.FormEvent) {
    e.preventDefault()
    setParsing(true)
    setError('')

    try {
      const res = await fetch('/api/recipes/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (data.recipe) {
        setParsed(data.recipe)
        setTab('manual')
      } else {
        setError(data.error ?? 'Could not parse recipe. Try entering it manually.')
        setParsed({ title: '', servings: 2, ingredients: [], instructions: [], tags: [] })
        setTab('manual')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setParsing(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setParsing(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('photo', file)
      const res = await fetch('/api/recipes/parse-photo', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.recipe) {
        setParsed(data.recipe)
        setTab('manual')
      } else {
        setError('Could not extract recipe from photo. Please review and fill in manually.')
        setParsed({ title: '', servings: 2, ingredients: [], instructions: [], tags: [] })
        setTab('manual')
      }
    } catch {
      setError('Something went wrong uploading the photo.')
    } finally {
      setParsing(false)
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    const form = new FormData(e.currentTarget)
    const body = {
      title: form.get('title'),
      description: form.get('description'),
      servings: Number(form.get('servings')),
      prep_time_minutes: Number(form.get('prep_time_minutes')) || null,
      cook_time_minutes: Number(form.get('cook_time_minutes')) || null,
      source_url: url || null,
      source_type: url ? 'web_url' : tab === 'photo' ? 'photo' : 'manual',
      ingredients: parsed?.ingredients ?? [],
      instructions: parsed?.instructions ?? [],
      tags: (form.get('tags') as string).split(',').map((t) => t.trim()).filter(Boolean),
    }

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.id) {
        router.push(`/recipes/${data.id}`)
      } else {
        setError('Could not save recipe.')
        setSaving(false)
      }
    } catch {
      setError('Something went wrong saving the recipe.')
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1 mb-8 bg-cream-200 rounded-lg p-1">
        {([['url', '🔗 From URL'], ['photo', '📷 Upload Photo'], ['manual', '✏️ Manual Entry']] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === 'manual' && !parsed) setParsed({ title: '', servings: 2, ingredients: [], instructions: [], tags: [] }) }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {tab === 'url' && (
        <form onSubmit={handleUrlParse} className="space-y-4">
          <div>
            <label className="label">Recipe URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.example.com/recipe"
              required
              className="input"
            />
          </div>
          <button type="submit" disabled={parsing} className="btn-primary w-full">
            {parsing ? 'Parsing recipe…' : 'Import Recipe'}
          </button>
        </form>
      )}

      {tab === 'photo' && !parsing && (
        <div>
          <label className="label">Upload a photo of the recipe</label>
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:bg-cream-50 transition-colors">
            <span className="text-4xl mb-2">📷</span>
            <span className="text-sm text-stone-500">Click to upload or drag & drop</span>
            <span className="text-xs text-stone-400 mt-1">JPG, PNG, WEBP</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="sr-only"
            />
          </label>
        </div>
      )}

      {parsing && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-stone-500">Extracting recipe…</p>
        </div>
      )}

      {tab === 'manual' && parsed !== null && (
        <RecipeEditForm parsed={parsed} onSave={handleSave} saving={saving} />
      )}
    </div>
  )
}

function RecipeEditForm({
  parsed,
  onSave,
  saving,
}: {
  parsed: ParsedRecipeJSON
  onSave: (e: React.FormEvent<HTMLFormElement>) => void
  saving: boolean
}) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(parsed.ingredients)
  const [instructions, setInstructions] = useState<Instruction[]>(parsed.instructions)

  function addIngredient() {
    setIngredients([...ingredients, { amount: '', unit: '', item: '', notes: '' }])
  }

  function updateIngredient(i: number, field: keyof Ingredient, value: string) {
    const updated = [...ingredients]
    updated[i] = { ...updated[i], [field]: value }
    setIngredients(updated)
  }

  function removeIngredient(i: number) {
    setIngredients(ingredients.filter((_, idx) => idx !== i))
  }

  function addStep() {
    setInstructions([...instructions, { step_number: instructions.length + 1, text: '' }])
  }

  function updateStep(i: number, text: string) {
    const updated = [...instructions]
    updated[i] = { ...updated[i], text }
    setInstructions(updated)
  }

  function removeStep(i: number) {
    setInstructions(
      instructions
        .filter((_, idx) => idx !== i)
        .map((s, idx) => ({ ...s, step_number: idx + 1 })),
    )
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      {/* hidden fields for ingredients/instructions */}
      <input type="hidden" name="ingredients" value={JSON.stringify(ingredients)} />
      <input type="hidden" name="instructions" value={JSON.stringify(instructions)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Title</label>
          <input name="title" defaultValue={parsed.title} required className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description (optional)</label>
          <input name="description" defaultValue={parsed.description} className="input" />
        </div>
        <div>
          <label className="label">Servings</label>
          <input name="servings" type="number" min={1} max={100} defaultValue={parsed.servings} required className="input" />
        </div>
        <div>
          <label className="label">Tags (comma separated)</label>
          <input name="tags" defaultValue={parsed.tags?.join(', ')} placeholder="chicken, quick, weeknight" className="input" />
        </div>
        <div>
          <label className="label">Prep time (minutes)</label>
          <input name="prep_time_minutes" type="number" min={0} defaultValue={parsed.prep_time_minutes} className="input" />
        </div>
        <div>
          <label className="label">Cook time (minutes)</label>
          <input name="cook_time_minutes" type="number" min={0} defaultValue={parsed.cook_time_minutes} className="input" />
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="label mb-0">Ingredients</label>
          <button type="button" onClick={addIngredient} className="text-sm text-terracotta-600 hover:text-terracotta-700">
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={ing.amount}
                onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
                placeholder="1½"
                className="input w-20 flex-shrink-0"
              />
              <input
                value={ing.unit}
                onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                placeholder="cups"
                className="input w-24 flex-shrink-0"
              />
              <input
                value={ing.item}
                onChange={(e) => updateIngredient(i, 'item', e.target.value)}
                placeholder="all-purpose flour"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                className="text-stone-400 hover:text-red-500 px-2 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="label mb-0">Instructions</label>
          <button type="button" onClick={addStep} className="text-sm text-terracotta-600 hover:text-terracotta-700">
            + Add step
          </button>
        </div>
        <div className="space-y-3">
          {instructions.map((step, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 mt-2 rounded-full bg-terracotta-100 text-terracotta-700 text-sm font-semibold flex items-center justify-center">
                {step.step_number}
              </span>
              <textarea
                value={step.text}
                onChange={(e) => updateStep(i, e.target.value)}
                rows={2}
                className="input flex-1 resize-none"
                placeholder={`Step ${step.step_number}`}
              />
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="text-stone-400 hover:text-red-500 px-2 flex-shrink-0 mt-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? 'Saving…' : 'Save Recipe'}
      </button>
    </form>
  )
}
