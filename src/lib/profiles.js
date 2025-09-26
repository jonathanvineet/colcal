import supabase from './supabaseClient'

export async function ensureProfile(user) {
  if (!user?.id) return { error: new Error('No user') }
  return supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )
}

export async function profileExists(userId) {
  if (!userId) return false
  const { data, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: false })
    .eq('id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    // An error other than "row not found"
    return false
  }
  return !!data?.id
}
