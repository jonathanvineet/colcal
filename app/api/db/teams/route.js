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
  
  // NOTE: upserting with org_id requires the unique constraint to include org_id,
  // which we updated in the schema.
  const { error } = await supabase
    .from('teams')
    .upsert(
      { 
        user_id: authData.userId, 
        org_id: authData.orgId === 'personal' ? null : authData.orgId,
        name, 
        color, 
        position: position ?? 0 
      },
      { onConflict: 'org_id,name' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
