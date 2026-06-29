const fs = require('fs');
const path = require('path');

const DIRS_TO_SCAN = ['app', 'lib', 'server', 'components'];

function getAllFiles(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        arrayOfFiles.push(path.join(process.cwd(), dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

let files = [];
DIRS_TO_SCAN.forEach(dir => {
  if (fs.existsSync(dir)) {
    files = getAllFiles(dir, files);
  }
});

let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Skip if it doesn't have console.log or error
  if (!content.includes('console.log') && !content.includes('console.error') && !content.includes('console.warn')) {
    return;
  }

  // Replace console.log with logger.info
  content = content.replace(/console\.log/g, 'logger.info');
  // Replace console.error with logger.error
  content = content.replace(/console\.error/g, 'logger.error');
  // Replace console.warn with logger.warn
  content = content.replace(/console\.warn/g, 'logger.warn');

  // Inject import { logger } from '@/lib/logger' if it doesn't exist
  if (!content.includes("import { logger }") && !content.includes("import {logger}")) {
    // Find the last import statement
    const importRegex = /import\s+.*?;?\n/g;
    let match;
    let lastIndex = 0;
    while ((match = importRegex.exec(content)) !== null) {
      lastIndex = match.index + match[0].length;
    }

    const importStmt = "import { logger } from '@/lib/logger';\n";
    if (lastIndex > 0) {
      content = content.slice(0, lastIndex) + importStmt + content.slice(lastIndex);
    } else {
      content = importStmt + content;
    }
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log(`Modified: ${file}`);
  }
});

console.log(`\nReplaced console statements in ${modifiedCount} files.`);
