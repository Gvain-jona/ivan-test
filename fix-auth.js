const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting auth fix script...');

// Step 1: Replace the check-email route
const checkEmailPath = path.join(__dirname, 'app', 'api', 'auth', 'check-email', 'route.ts');
const newCheckEmailPath = path.join(__dirname, 'app', 'api', 'auth', 'check-email', 'route.new.ts');

if (fs.existsSync(newCheckEmailPath)) {
  console.log('Replacing check-email route...');
  try {
    // Backup the original file
    const backupPath = path.join(__dirname, 'app', 'api', 'auth', 'check-email', 'route.ts.bak');
    if (fs.existsSync(checkEmailPath)) {
      fs.copyFileSync(checkEmailPath, backupPath);
      console.log('Original file backed up to', backupPath);
    }
    
    // Replace the file
    fs.copyFileSync(newCheckEmailPath, checkEmailPath);
    console.log('check-email route replaced successfully');
  } catch (error) {
    console.error('Error replacing check-email route:', error.message);
  }
} else {
  console.log('New check-email route file not found');
}

// Step 2: Run the clean build script
console.log('Running clean build script...');
try {
  execSync('node clean-build.js', { stdio: 'inherit' });
  console.log('Clean build completed successfully');
} catch (error) {
  console.error('Error running clean build:', error.message);
}

console.log('Auth fix script completed!');
console.log('Now run "npm install" followed by "npm run dev:normal" to restart the development server.');
