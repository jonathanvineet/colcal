import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../src/lib/supabaseServer'
import { getEffectiveAuth, applyAuthFilter } from '../../../../src/lib/authHelper'

export async function GET(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('teams')
    .select('name, color, position')

  query = applyAuthFilter(query, authData)
  const { data, error } = await query.order('position', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, color, position } = await request.json()
  if (!name || !color) {
    return NextResponse.json({ error: 'name and color are required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  
  const effectiveOrgId = authData.orgId === 'personal' ? null : authData.orgId

  if (effectiveOrgId === null) {
    // NULL org_id: PostgreSQL unique constraint doesn't match NULL = NULL,
    // so we manually check for existence and insert/update accordingly.
    const { data: existing } = await supabase
      .from('teams')
      .select('id')
      .is('org_id', null)
      .eq('name', name)
      .eq('user_id', authData.userId)
      .maybeSingle()

    let error
    if (existing) {
      ({ error } = await supabase
        .from('teams')
        .update({ color, position: position ?? 0 })
        .eq('id', existing.id))
    } else {
      ({ error } = await supabase
        .from('teams')
        .insert({ user_id: authData.userId, org_id: null, name, color, position: position ?? 0 }))
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from('teams')
      .upsert(
        { 
          user_id: authData.userId, 
          org_id: effectiveOrgId,
          name, 
          color, 
          position: position ?? 0 
        },
        { onConflict: 'org_id,name' }
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('teams')
    .delete()
    .eq('name', name)

  query = applyAuthFilter(query, authData)
  const { error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
