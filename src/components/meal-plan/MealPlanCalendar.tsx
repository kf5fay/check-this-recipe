'use client'

import { useState } from 'react'
import type { MealPlanEntry } from '@/types'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SLOTS = ['breakfast', 'lunch', 'dinner'] as const

type SimpleRecipe = { id: string; title: string }

export function MealPlanCalendar({
  weekStart,
  entries,
  recipes,
  userId,
}: {
  weekStart: string
  entries: MealPlanEntry[]
  recipes: SimpleRecipe[]
  userId: string
}) {
  const [localEntries, setLocalEntries] = useState<MealPlanEntry[]>(entries)
  const [adding, setAdding] = useState<{ day: number; slot: string } | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState('')

  function getEntries(dayOfWeek: number, slot: string) {
    return localEntries.filter((e) => e.day_of_week === dayOfWeek && e.meal_slot === slot)
  }

  async function handleAdd(dayOfWeek: number, slot: typeof SLOTS[number]) {
    if (!selectedRecipe) return
    const recipe = recipes.find((r) => r.id === selectedRecipe)
    if (!recipe) return

    const res = await fetch('/api/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipe_id: selectedRecipe,
        week_start: weekStart,
        day_of_week: dayOfWeek,
        meal_slot: slot,
        servings: 2,
        user_id: userId,
      }),
    })
    const data = await res.json()
    if (data.id) {
      setLocalEntries([...localEntries, { ...data, recipe }])
    }
    setAdding(null)
    setSelectedRecipe('')
  }

  async function handleRemove(entryId: string) {
    await fetch(`/api/meal-plan/${entryId}`, { method: 'DELETE' })
    setLocalEntries(localEntries.filter((e) => e.id !== entryId))
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-8 gap-px bg-stone-200 rounded-xl overflow-hidden min-w-[640px]">
        {/* Header */}
        <div className="bg-cream-100 p-3" />
        {DAYS.map((day) => (
          <div key={day} className="bg-cream-100 p-3 text-center text-xs font-semibold text-stone-600 uppercase tracking-wide">
            {day.slice(0, 3)}
          </div>
        ))}

        {/* Rows */}
        {SLOTS.map((slot) => (
          <>
            <div key={slot + '-label'} className="bg-white p-3 flex items-center justify-center">
              <span className="text-xs font-medium text-stone-400 capitalize">{slot}</span>
            </div>
            {DAYS.map((_, dayIndex) => {
              const dayOfWeek = dayIndex + 1
              const cellEntries = getEntries(dayOfWeek, slot)
              const isAdding = adding?.day === dayOfWeek && adding?.slot === slot

              return (
                <div key={dayIndex} className="bg-white p-2 min-h-[80px]">
                  {cellEntries.map((entry) => (
                    <div key={entry.id} className="mb-1 rounded bg-terracotta-50 px-2 py-1 text-xs text-terracotta-800 flex justify-between items-center gap-1 group">
                      <span className="truncate">{entry.recipe?.title ?? 'Recipe'}</span>
                      <button
                        onClick={() => handleRemove(entry.id)}
                        className="opacity-0 group-hover:opacity-100 text-terracotta-400 hover:text-red-500 flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {isAdding ? (
                    <div className="space-y-1">
                      <select
                        value={selectedRecipe}
                        onChange={(e) => setSelectedRecipe(e.target.value)}
                        className="w-full text-xs border border-stone-200 rounded px-1.5 py-1 bg-white"
                        autoFocus
                      >
                        <option value="">Pick a recipe…</option>
                        {recipes.map((r) => (
                          <option key={r.id} value={r.id}>{r.title}</option>
                        ))}
                      </select>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAdd(dayOfWeek, slot)}
                          className="flex-1 text-xs bg-terracotta-600 text-white rounded py-0.5"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setAdding(null); setSelectedRecipe('') }}
                          className="text-xs text-stone-400 px-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAdding({ day: dayOfWeek, slot })}
                      className="w-full text-left text-xs text-stone-300 hover:text-terracotta-500 transition-colors"
                    >
                      + add
                    </button>
                  )}
                </div>
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}
