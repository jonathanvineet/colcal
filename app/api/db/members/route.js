import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../src/lib/supabaseServer'
import { getEffectiveAuth, applyAuthFilter } from '../../../../src/lib/authHelper'

export async function GET(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('team_members')
    .select('team_name, member_id')
  
  if (authData.orgId === 'personal') {
    query = query.is('org_id', null)
  } else {
    query = query.eq('org_id', authData.orgId)
  }

  const { data, error } = await query.order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { teamName, memberId } = await request.json()
  if (!teamName || !memberId) {
    return NextResponse.json({ error: 'teamName and memberId are required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('team_members')
    .upsert(
      { 
        org_id: authData.orgId === 'personal' ? null : authData.orgId,
        team_name: teamName, 
        member_id: memberId 
      },
      { onConflict: 'org_id,team_name,member_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request) {
  const authData = await getEffectiveAuth(request.url)
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const teamName = searchParams.get('teamName')
  const memberId = searchParams.get('memberId')

  if (!teamName || !memberId) {
    return NextResponse.json({ error: 'teamName and memberId are required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('team_members')
    .delete()
    .eq('team_name', teamName)
    .eq('member_id', memberId)
  
  if (authData.orgId === 'personal') {
    query = query.is('org_id', null)
  } else {
    query = query.eq('org_id', authData.orgId)
  }
  const { error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
