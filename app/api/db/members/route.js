import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../src/lib/supabaseServer'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('team_members')
    .select('team_name, member_name')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { teamName, memberName } = await request.json()
  if (!teamName || !memberName) {
    return NextResponse.json({ error: 'teamName and memberName are required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('team_members')
    .upsert(
      { user_id: userId, team_name: teamName, member_name: memberName },
      { onConflict: 'user_id,team_name,member_name' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const teamName = searchParams.get('teamName')
  const memberName = searchParams.get('memberName')

  if (!teamName || !memberName) {
    return NextResponse.json({ error: 'teamName and memberName are required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('user_id', userId)
    .eq('team_name', teamName)
    .eq('member_name', memberName)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
