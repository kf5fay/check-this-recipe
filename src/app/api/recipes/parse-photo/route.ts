import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractRecipeFromPhoto } from '@/lib/anthropic'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const photo = formData.get('photo') as File | null
  if (!photo) return NextResponse.json({ error: 'Photo required' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(photo.type)) {
    return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 })
  }

  const arrayBuffer = await photo.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  // Also store the photo in Supabase Storage
  const path = `recipe-photos/${user.id}/${Date.now()}-${photo.name}`
  await supabase.storage.from('recipe-photos').upload(path, arrayBuffer, {
    contentType: photo.type,
  })

  const recipe = await extractRecipeFromPhoto(
    base64,
    photo.type as 'image/jpeg' | 'image/png' | 'image/webp',
  )

  if (!recipe) {
    return NextResponse.json({ error: 'Could not extract recipe from photo', uploaded_path: path }, { status: 422 })
  }

  return NextResponse.json({ recipe, uploaded_path: path })
}
