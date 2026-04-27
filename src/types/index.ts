export type SourceType = 'web_url' | 'instagram' | 'tiktok' | 'youtube' | 'photo' | 'manual'
export type RecipeStatus = 'draft' | 'complete'
export type FriendshipStatus = 'pending' | 'accepted'

export interface Ingredient {
  amount: string
  unit: string
  item: string
  notes?: string
}

export interface Instruction {
  step_number: number
  text: string
}

export interface Recipe {
  id: string
  owner_id: string
  title: string
  description?: string
  source_url?: string
  source_type: SourceType
  original_image_url?: string
  uploaded_image_path?: string
  status: RecipeStatus
  servings: number
  prep_time_minutes?: number
  cook_time_minutes?: number
  ingredients: Ingredient[]
  instructions: Instruction[]
  tags: string[]
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  display_name: string
  avatar_url?: string
  created_at: string
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  requester?: User
  addressee?: User
}

export interface Collection {
  id: string
  name: string
  owner_id: string
  created_at: string
  members?: User[]
  recipes?: Recipe[]
}

export interface CollectionMember {
  collection_id: string
  user_id: string
  joined_at: string
}

export interface SharedRecipe {
  id: string
  recipe_id: string
  sender_id: string
  recipient_id: string
  note?: string
  created_at: string
  recipe?: Recipe
  sender?: User
}

export interface Notification {
  id: string
  user_id: string
  type: 'friend_request' | 'friend_accepted' | 'recipe_shared' | 'collection_recipe_added'
  payload: Record<string, string>
  read: boolean
  created_at: string
}

export interface MealPlanEntry {
  id: string
  user_id: string
  recipe_id: string
  week_start: string
  day_of_week: number
  meal_slot?: 'breakfast' | 'lunch' | 'dinner'
  servings: number
  recipe?: Recipe
}

export interface RecipeNote {
  id: string
  recipe_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

// Claude API response shapes
export interface ParsedRecipeJSON {
  title: string
  description?: string
  servings: number
  prep_time_minutes?: number
  cook_time_minutes?: number
  ingredients: Ingredient[]
  instructions: Instruction[]
  tags?: string[]
}
