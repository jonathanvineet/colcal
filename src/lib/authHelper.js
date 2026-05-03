import { auth } from '@clerk/nextjs/server'

export async function getEffectiveAuth(requestUrl) {
  const { userId, orgId } = await auth()
  
  if (!userId) {
    return { userId: null, orgId: null }
  }

  const isSuperUser = process.env.NEXT_PUBLIC_SUPERUSER_ID && userId === process.env.NEXT_PUBLIC_SUPERUSER_ID
  
  // Use orgId if available, otherwise fallback to 'personal' so queries still isolate to null/personal boundary
  let effectiveOrgId = orgId || 'personal'

  if (isSuperUser && requestUrl) {
    const searchParams = new URL(requestUrl).searchParams
    const override = searchParams.get('superOrgId')
    if (override) {
      effectiveOrgId = override
    }
  }

  // Build the DB filter constraint
  // To keep it simple, we either filter by org_id. If missing (personal), we also match their user_id.
  
  return { userId, orgId: effectiveOrgId, isSuperUser }
}

export function applyAuthFilter(query, authData) {
  if (authData.orgId === 'personal') {
    // If not in an org, only show their own personal records
    return query.is('org_id', null).eq('user_id', authData.userId)
  } else {
    // In an org, or superuser viewing an org, filter strictly by that org
    return query.eq('org_id', authData.orgId)
  }
}
