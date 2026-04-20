const fs = require('fs');
const path = require('path');
const pagesFile = path.join(__dirname, 'examples/backend/app/pages.json');

const content = fs.readFileSync(pagesFile, 'utf8');
const data = JSON.parse(content);

console.log('Before cleanup:', data.pages.length, 'pages');

data.pages = data.pages.filter(p => 
  p && typeof p === 'object' && 
  p.uuid_page && typeof p.uuid_page === 'string' &&
  !p.uuid_page.includes('[object Object]')
);

console.log('After cleanup:', data.pages.length, 'pages');

fs.writeFileSync(pagesFile, JSON.stringify(data, null, 2));
console.log('Cleanup complete!');