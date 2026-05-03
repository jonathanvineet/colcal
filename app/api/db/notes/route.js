import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../src/lib/supabaseServer'
import { getEffectiveAuth, applyAuthFilter } from '../../../../src/lib/authHelper'

export async function GET(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('notes')
    .select('id, date_key, text, author_name, team, saved_at')
  
  query = applyAuthFilter(query, authData)
  const { data, error } = await query.order('saved_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, dateKey, text, authorName, team, savedAt } = await request.json()
  if (!id || !dateKey || !text) {
    return NextResponse.json({ error: 'id, dateKey, and text are required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('notes')
    .upsert(
      {
        id,
        user_id: authData.userId,
        org_id: authData.orgId === 'personal' ? null : authData.orgId,
        date_key: dateKey,
        text,
        author_name: authorName || 'Unknown User',
        team: team || 'General',
        saved_at: savedAt || new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  let query = supabase.from('notes').delete().eq('id', id)
  query = applyAuthFilter(query, authData)
  
  const { error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
