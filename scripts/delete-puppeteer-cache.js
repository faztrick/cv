
const fs = require('fs');
const path = 'C:\\Users\\faztrick\\.cache\\puppeteer';

if (fs.existsSync(path)) {
  fs.rmSync(path, { recursive: true, force: true });
  console.log(`Successfully deleted ${path}`);
} else {
  console.log(`Directory ${path} does not exist.`);
}
