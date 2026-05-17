import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../src/lib/supabaseServer'
import { getEffectiveAuth, applyAuthFilter } from '../../../../src/lib/authHelper'

export async function GET(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('tasks')
    .select('id, date_key, time, task, team, completed, assignee, details, attachments')
  
  query = applyAuthFilter(query, authData)
  const { data, error } = await query.order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dateKey, time, task, team, completed, assignee, details, attachments } = await request.json()
  if (!dateKey || !task) {
    return NextResponse.json({ error: 'dateKey and task are required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: authData.userId,
      org_id: authData.orgId === 'personal' ? null : authData.orgId,
      date_key: dateKey,
      time: time || 'Anytime',
      task,
      team: team || 'General',
      completed: !!completed,
      assignee: assignee || null,
      details: details || null,
      attachments: attachments || [],
    })
    .select('id, date_key, time, task, team, completed, assignee, details, attachments')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PUT(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, completed, task, assignee, team, details, attachments } = body
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const updates = {}
  if (completed !== undefined) updates.completed = !!completed
  if (task !== undefined) updates.task = task
  if (assignee !== undefined) updates.assignee = assignee === '' ? null : assignee
  if (team !== undefined) updates.team = team
  if (details !== undefined) updates.details = details
  if (attachments !== undefined) updates.attachments = attachments

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)

  query = applyAuthFilter(query, authData)
  const { data, error } = await query.select('id, date_key, time, task, team, completed, assignee, details, attachments').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  query = applyAuthFilter(query, authData)
  const { error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
