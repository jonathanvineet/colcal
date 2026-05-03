
const fs = require('fs');
let code = fs.readFileSync('C:/Users/Gaming/Pictures/Coding_Projects/colcal/colcal/app/page.js', 'utf8');

if (!code.includes('import ProfileSettings')) {
  code = code.replace(
    /import TeamMembersCard from '@\/components\/TeamMembersCard'/,
    \import TeamMembersCard from '@/components/TeamMembersCard'\nimport ProfileSettings from '@/components/ProfileSettings'\
  );

  code = code.replace(
    /<TeamMembersCard\n\s*teams={teams}/,
    \<ProfileSettings />\n                <TeamMembersCard\n                  teams={teams}\
  );
}

fs.writeFileSync('C:/Users/Gaming/Pictures/Coding_Projects/colcal/colcal/app/page.js', code);

