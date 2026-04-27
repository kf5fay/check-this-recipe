import Anthropic from '@anthropic-ai/sdk'
import type { ParsedRecipeJSON } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-sonnet-4-6'

const RECIPE_SYSTEM_PROMPT = `You are a recipe parsing assistant. Always respond with valid JSON only — no markdown fences, no extra text. Convert all measurements to US customary (SAE) units. Practical measurements only: ⅛ tsp, ¼ tsp, ½ tsp, 1 tsp, ½ tbsp, 1 tbsp, 2 tbsp, ¼ cup, ⅓ cup, ½ cup, ⅔ cup, ¾ cup, 1 cup, etc. Convert Celsius to Fahrenheit for temperatures. Convert grams to ounces or pounds as appropriate.`

export async function cleanAndStructureRecipe(rawText: string): Promise<ParsedRecipeJSON | null> {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: RECIPE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Parse the following recipe text into structured JSON. Return an object matching this TypeScript type:
{
  title: string
  description?: string
  servings: number
  prep_time_minutes?: number
  cook_time_minutes?: number
  ingredients: Array<{ amount: string; unit: string; item: string; notes?: string }>
  instructions: Array<{ step_number: number; text: string }>
  tags?: string[]
}

Recipe text:
${rawText}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(text) as ParsedRecipeJSON
  } catch {
    return null
  }
}

export async function extractRecipeFromPhoto(base64Image: string, mediaType: 'image/jpeg' | 'image/png' | 'image/webp'): Promise<ParsedRecipeJSON | null> {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: RECIPE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Extract the recipe from this image and return structured JSON matching this TypeScript type:
{
  title: string
  description?: string
  servings: number
  prep_time_minutes?: number
  cook_time_minutes?: number
  ingredients: Array<{ amount: string; unit: string; item: string; notes?: string }>
  instructions: Array<{ step_number: number; text: string }>
  tags?: string[]
}`,
            },
          ],
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(text) as ParsedRecipeJSON
  } catch {
    return null
  }
}

export async function extractRecipeFromCaption(caption: string): Promise<ParsedRecipeJSON | null> {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: RECIPE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Determine if the following social media caption contains a recipe. If it does, extract and structure it as JSON matching this type:
{
  title: string
  description?: string
  servings: number
  prep_time_minutes?: number
  cook_time_minutes?: number
  ingredients: Array<{ amount: string; unit: string; item: string; notes?: string }>
  instructions: Array<{ step_number: number; text: string }>
  tags?: string[]
}

If no recipe is present, return: {"no_recipe": true}

Caption:
${caption}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text)
    if ('no_recipe' in parsed) return null
    return parsed as ParsedRecipeJSON
  } catch {
    return null
  }
}

export async function consolidateIngredients(
  ingredientLists: Array<{ recipe_title: string; ingredients: Array<{ amount: string; unit: string; item: string }> }>,
): Promise<Array<{ amount: string; unit: string; item: string; category: string }> | null> {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: RECIPE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Consolidate and deduplicate the following ingredient lists from multiple recipes into a single shopping list. Combine the same ingredient (e.g. "2 cloves garlic" + "1 garlic clove" = "3 garlic cloves"). Return a JSON array where each item has: { amount: string, unit: string, item: string, category: string }. Categories: "Produce", "Meat & Seafood", "Dairy & Eggs", "Pantry / Dry Goods", "Canned & Jarred", "Frozen", "Bread & Bakery", "Other".

Ingredient lists:
${JSON.stringify(ingredientLists, null, 2)}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(text)
  } catch {
    return null
  }
}
