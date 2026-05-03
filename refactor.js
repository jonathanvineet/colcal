const fs = require('fs');
const path = require('path');

const routes = [
  'tasks/route.js',
  'teams/route.js',
  'members/route.js',
  'notes/route.js',
  'events/route.js'
];

const basePath = path.join(__dirname, 'app/api/db');

for (const route of routes) {
  const fullPath = path.join(basePath, route);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Add auth helper import
  if (!content.includes('authHelper')) {
    content = content.replace("import { auth } from '@clerk/nextjs/server'",
      "import { auth } from '@clerk/nextjs/server'\nimport { getEffectiveAuth, applyAuthFilter } from '../../../../src/lib/authHelper'"
    );
  }

  // Replace auth calls
  content = content.replace(/const { userId } = await auth\(\)/g, "const authData = await getEffectiveAuth(request?.url)\n  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })");
  content = content.replace(/if \(!userId\) return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\)/g, "");

  // Update .eq('user_id', userId) -> .eq('user_id', authData.userId).eq('org_id', authData.orgId === 'personal' ? null : authData.orgId)
  // Actually, wait, it's easier to just Regex it to applyAuthFilter
  
  // Custom manual fixes using regex would be a bit fragile.
  // Instead of fully automating with this script, I'll just write exactly what it should be and write files manually since there's only 5.
}
