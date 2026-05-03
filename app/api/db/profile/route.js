import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../src/lib/supabaseServer'

export async function GET(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Support batch fetching multiple profiles via query param ?ids=user1,user2
  const { searchParams } = new URL(request.url)
  const idsParam = searchParams.get('ids')
  
  const supabase = createServerSupabaseClient()
  if (idsParam) {
    const ids = idsParam.split(',').filter(Boolean)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, display_name')
      .in('user_id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } else {
    // Fetch just the current user's profile
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, display_name')
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') { // Ignore "Row not found"
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: data || null })
  }
}

export async function POST(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { displayName } = await request.json()
  if (!displayName) return NextResponse.json({ error: 'displayName is required' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      { user_id: userId, display_name: displayName, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
