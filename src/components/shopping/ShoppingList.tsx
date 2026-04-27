'use client'

import { useState } from 'react'

type ShoppingItem = {
  amount: string
  unit: string
  item: string
  category: string
}

const CATEGORY_ORDER = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Pantry / Dry Goods',
  'Canned & Jarred',
  'Frozen',
  'Bread & Bakery',
  'Other',
]

export function ShoppingList({
  shoppingItems,
  pantryItems,
}: {
  shoppingItems: ShoppingItem[]
  pantryItems: ShoppingItem[]
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [movedToPrimary, setMovedToPrimary] = useState<Set<string>>(new Set())

  function toggleCheck(key: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function moveToMain(key: string) {
    setMovedToPrimary((prev) => new Set([...prev, key]))
  }

  const allShoppingItems = [
    ...shoppingItems,
    ...pantryItems.filter((i) => movedToPrimary.has(`pantry-${i.item}`)),
  ]

  const byCategory = CATEGORY_ORDER.reduce<Record<string, ShoppingItem[]>>((acc, cat) => {
    const items = allShoppingItems.filter((i) => i.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})
  const uncategorized = allShoppingItems.filter((i) => !CATEGORY_ORDER.includes(i.category))
  if (uncategorized.length) byCategory['Other'] = [...(byCategory['Other'] ?? []), ...uncategorized]

  function handlePrint() {
    window.print()
  }

  async function handleShare() {
    const lines = allShoppingItems
      .filter((i) => !checked.has(`shopping-${i.item}`))
      .map((i) => `• ${i.amount} ${i.unit} ${i.item}`.trim())
      .join('\n')
    await navigator.clipboard.writeText(lines)
    alert('Shopping list copied to clipboard!')
  }

  return (
    <div>
      <div className="flex gap-2 mb-8 no-print">
        <button onClick={handlePrint} className="btn-secondary text-sm">Print</button>
        <button onClick={handleShare} className="btn-secondary text-sm">Copy as text</button>
      </div>

      {/* Shopping items by category */}
      <div className="space-y-8">
        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">{category}</h2>
            <ul className="space-y-2">
              {items.map((item) => {
                const key = `shopping-${item.item}`
                const isChecked = checked.has(key)
                return (
                  <li
                    key={key}
                    onClick={() => toggleCheck(key)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isChecked ? 'opacity-50' : 'hover:bg-cream-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                      isChecked ? 'bg-sage-500 border-sage-500' : 'border-stone-300'
                    }`}>
                      {isChecked && <span className="text-white text-xs flex items-center justify-center h-full">✓</span>}
                    </div>
                    <span className={`text-stone-700 ${isChecked ? 'line-through' : ''}`}>
                      <strong>{item.amount} {item.unit}</strong> {item.item}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Pantry / check before you shop */}
      {pantryItems.filter((i) => !movedToPrimary.has(`pantry-${i.item}`)).length > 0 && (
        <div className="mt-10 pt-8 border-t border-stone-200">
          <h2 className="text-base font-semibold text-stone-700 mb-1">Check Before You Shop</h2>
          <p className="text-xs text-stone-400 mb-4">You probably already have these — tap to add to your list if you&apos;re out.</p>
          <ul className="space-y-2">
            {pantryItems
              .filter((i) => !movedToPrimary.has(`pantry-${i.item}`))
              .map((item) => (
                <li
                  key={`pantry-${item.item}`}
                  onClick={() => moveToMain(`pantry-${item.item}`)}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-cream-200 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-dashed border-stone-300 flex-shrink-0" />
                  <span className="text-stone-400 text-sm">
                    <strong>{item.amount} {item.unit}</strong> {item.item}
                  </span>
                  <span className="ml-auto text-xs text-terracotta-500 no-print">add →</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}
