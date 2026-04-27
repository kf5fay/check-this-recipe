import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contact } = await request.json()
  if (!contact) return NextResponse.json({ error: 'Contact required' }, { status: 400 })

  const isEmail = contact.includes('@')

  // Look up existing user
  let { data: addressee } = await supabase
    .from('profiles')
    .select('id, email')
    .eq(isEmail ? 'email' : 'phone', contact)
    .single()

  if (!addressee) {
    // Send email invite via Supabase Auth admin
    const { createServiceClient } = await import('@/lib/supabase/server')
    const serviceClient = await createServiceClient()
    const { data: inviteData } = await serviceClient.auth.admin.inviteUserByEmail(contact)

    if (inviteData?.user) {
      addressee = { id: inviteData.user.id, email: contact }
    } else {
      return NextResponse.json({ error: 'Could not find or invite user.' }, { status: 404 })
    }
  }

  if (addressee.id === user.id) {
    return NextResponse.json({ error: "You can't add yourself." }, { status: 400 })
  }

  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: user.id, addressee_id: addressee.id })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Friend request already sent.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Create notification
  await supabase.from('notifications').insert({
    user_id: addressee.id,
    type: 'friend_request',
    payload: { requester_id: user.id },
  })

  return NextResponse.json({ message: 'Friend request sent!' })
}
