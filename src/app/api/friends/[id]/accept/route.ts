import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: friendship, error: fetchError } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', id)
    .eq('addressee_id', user.id)
    .single()

  if (fetchError || !friendship) {
    return NextResponse.json({ error: 'Friendship not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify requester
  await supabase.from('notifications').insert({
    user_id: friendship.requester_id,
    type: 'friend_accepted',
    payload: { accepter_id: user.id },
  })

  return NextResponse.redirect(new URL('/friends', process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:3000'))
}
