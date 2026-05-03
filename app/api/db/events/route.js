import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../src/lib/supabaseServer'
import { getEffectiveAuth, applyAuthFilter } from '../../../../src/lib/authHelper'

export async function GET(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('calendar_events')
    .select('id, title, start_time, end_time, all_day')
  
  query = applyAuthFilter(query, authData)
  const { data, error } = await query.order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Transform snake_case DB columns -> camelCase for FullCalendar
  const events = (data || []).map((row) => ({
    id: row.id,
    title: row.title,
    start: row.start_time,
    end: row.end_time,
    allDay: row.all_day,
  }))

  return NextResponse.json({ data: events })
}

export async function POST(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, title, start, end, allDay } = await request.json()
  if (!id || !title || !start) {
    return NextResponse.json({ error: 'id, title, and start are required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('calendar_events')
    .insert({
      id,
      user_id: authData.userId,
      org_id: authData.orgId === 'personal' ? null : authData.orgId,
      title,
      start_time: start,
      end_time: end || null,
      all_day: allDay ?? false,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PUT(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, start, end, allDay } = await request.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('calendar_events')
    .update({
      start_time: start,
      end_time: end || null,
      all_day: allDay ?? false,
    })
    .eq('id', id)
  
  query = applyAuthFilter(query, authData)
  const { error } = await query

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
  let query = supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
  
  query = applyAuthFilter(query, authData)
  const { error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
