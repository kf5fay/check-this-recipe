'use client'

import { useState } from 'react'
import type { Ingredient } from '@/types'

function scaleAmount(amount: string, factor: number): string {
  const num = parseFloat(amount)
  if (isNaN(num)) return amount
  const scaled = num * factor

  // Express as a simple fraction if close
  const fractions: [number, string][] = [
    [0.125, '⅛'], [0.25, '¼'], [0.333, '⅓'], [0.5, '½'],
    [0.667, '⅔'], [0.75, '¾'],
  ]
  const whole = Math.floor(scaled)
  const frac = scaled - whole
  for (const [val, sym] of fractions) {
    if (Math.abs(frac - val) < 0.04) {
      return whole > 0 ? `${whole}${sym}` : sym
    }
  }
  return scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1).replace(/\.0$/, '')
}

export function ServingsSelector({
  defaultServings,
  ingredients,
}: {
  defaultServings: number
  ingredients: Ingredient[]
}) {
  const [servings, setServings] = useState(defaultServings)
  const factor = servings / defaultServings

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-medium text-stone-700">Servings:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setServings(Math.max(1, servings - 1))}
            className="w-8 h-8 rounded-full bg-cream-200 text-stone-700 hover:bg-cream-300 font-medium transition-colors"
          >
            −
          </button>
          <span className="w-8 text-center font-semibold text-stone-800">{servings}</span>
          <button
            onClick={() => setServings(Math.min(20, servings + 1))}
            className="w-8 h-8 rounded-full bg-cream-200 text-stone-700 hover:bg-cream-300 font-medium transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-stone-800 mb-4">Ingredients</h2>
        <ul className="space-y-2">
          {ingredients.map((ing, i) => (
            <li key={i} className="flex gap-2 text-stone-700">
              <span className="font-medium w-20 flex-shrink-0 text-right">
                {scaleAmount(ing.amount, factor)} {ing.unit}
              </span>
              <span>{ing.item}{ing.notes ? <span className="text-stone-400"> ({ing.notes})</span> : null}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
