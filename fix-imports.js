const fs = require('fs');
const path = require('path');

// Function to find all .tsx files recursively
function findFilesRecursively(dir, pattern, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFilesRecursively(filePath, pattern, fileList);
    } else if (pattern.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to check if a file contains the pattern
function fileContainsPattern(filePath, pattern) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return pattern.test(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return false;
  }
}

// Find all .tsx files
const allTsxFiles = findFilesRecursively('app', /\.tsx$/);
console.log(`Found ${allTsxFiles.length} .tsx files in total`);

// Filter files that contain @/app/ pattern
const targetFiles = allTsxFiles.filter(file => {
  return fileContainsPattern(file, /@\/app\//);
});

console.log(`Found ${targetFiles.length} files with @/app/ imports to update:`);
targetFiles.forEach(file => console.log(`- ${file}`));

// Update each file
let updatedCount = 0;
targetFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    // Replace all occurrences of @/app/ with @/
    content = content.replace(/@\/app\//g, '@/');
    
    // Only write the file if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated: ${file}`);
      updatedCount++;
    } else {
      console.log(`No changes needed: ${file}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log(`Import path fix completed! Updated ${updatedCount} files.`); 