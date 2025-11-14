const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to clean
const dirsToClean = [
  '.next',
  'node_modules/.cache'
];

console.log('Cleaning build cache...');

// Delete directories
dirsToClean.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`Removing ${dir}...`);
    try {
      if (process.platform === 'win32') {
        // On Windows, use rmdir /s /q
        execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'inherit' });
      } else {
        // On Unix-like systems, use rm -rf
        execSync(`rm -rf "${dirPath}"`, { stdio: 'inherit' });
      }
      console.log(`Successfully removed ${dir}`);
    } catch (error) {
      console.error(`Error removing ${dir}:`, error.message);
    }
  } else {
    console.log(`Directory ${dir} does not exist, skipping`);
  }
});

console.log('Build cache cleaned successfully!');
console.log('Now run "npm install" followed by "npm run dev" to restart the development server.');
