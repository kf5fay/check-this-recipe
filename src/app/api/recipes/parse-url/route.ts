import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cleanAndStructureRecipe } from '@/lib/anthropic'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await request.json()
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  // Try the Python recipe-scraper microservice first
  const scraperUrl = process.env.RECIPE_SCRAPER_SERVICE_URL
  if (scraperUrl) {
    try {
      const scraperRes = await fetch(`${scraperUrl}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(15000),
      })

      if (scraperRes.ok) {
        const rawText = await scraperRes.text()
        const recipe = await cleanAndStructureRecipe(rawText)
        if (recipe) return NextResponse.json({ recipe })
      }
    } catch {
      // Scraper unavailable — fall through to error response
    }
  }

  // Try fetching raw page text as fallback
  try {
    const pageRes = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (pageRes.ok) {
      const html = await pageRes.text()

      // Try JSON-LD structured data first (most recipe sites use this)
      const jsonLdMatches = [...html.matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi
      )]
      for (const match of jsonLdMatches) {
        try {
          const jsonData = JSON.parse(match[1])
          const recipeData = Array.isArray(jsonData)
            ? jsonData.find(item => item['@type'] === 'Recipe')
            : jsonData['@type'] === 'Recipe' ? jsonData : null
          if (recipeData) {
            const recipe = await cleanAndStructureRecipe(JSON.stringify(recipeData))
            if (recipe) return NextResponse.json({ recipe })
          }
        } catch { continue }
      }

      // Strip HTML tags for Claude
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 8000)
      const recipe = await cleanAndStructureRecipe(text)
      if (recipe) return NextResponse.json({ recipe })
    }
  } catch {
    // Network error
  }

  return NextResponse.json({ error: 'Could not parse recipe from URL' }, { status: 422 })
}
