import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../../../src/lib/supabaseServer'

export async function GET() {
  const { userId } = await auth()
  
  if (!userId || userId !== process.env.NEXT_PUBLIC_SUPERUSER_ID) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  
  // We can find unique org_ids by looking at the teams table or tasks table
  // Since some users might only have tasks without a team created, we just group by org_id in tasks.
  // Using an RPC might be cleaner for distinct, but we can just query distinct if supported, or fetch and manually distinct if the dataset is small.
  // Supabase postgrest doesn't have a direct 'DISTINCT' operator in JS easily without RPC, so we fetch and filter:
  const { data, error } = await supabase.from('tasks').select('org_id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Deduplicate
  const uniqueOrgs = [...new Set(data.map(r => r.org_id))].map(id => ({ org_id: id }))

  return NextResponse.json({ orgs: uniqueOrgs })
}
