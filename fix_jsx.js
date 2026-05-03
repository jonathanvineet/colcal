const fs = require('fs');
const files = [
  'C:/Users/Gaming/Pictures/Coding_Projects/colcal/colcal/src/components/TeamMembersCard.jsx',
  'C:/Users/Gaming/Pictures/Coding_Projects/colcal/colcal/src/components/ProfileSettings.jsx'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/\\"/g, '"');
    fs.writeFileSync(f, content);
    console.log('Fixed', f);
  }
});
