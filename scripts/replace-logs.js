const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'app/global-error.tsx',
  'lib/env.ts',
  'lib/firebase-admin.ts',
  'lib/prisma.ts',
  'lib/rate-limiter.ts',
  'lib/rithmic-storage.ts',
  'server/accounts.ts',
  'server/dashboard-templates.ts',
  'server/geolocation.ts',
  'server/thor.ts',
  'server/trades.ts',
  'server/user-data.ts',
];

for (const file of filesToUpdate) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    let hasChanges = false;

    if (content.includes('console.error') || content.includes('console.log') || content.includes('console.warn')) {
      // Very basic regex replacements that attempt to preserve the message
      content = content.replace(/console\.error\('([^']+)', ([^)]+)\)/g, "logger.error({ event: 'system_error', error: $2 }, '$1')");
      content = content.replace(/console\.error\(`([^`]+)`, ([^)]+)\)/g, "logger.error({ event: 'system_error', error: $2 }, `$1`)");
      content = content.replace(/console\.error\('([^']+)'\)/g, "logger.error({ event: 'system_error' }, '$1')");
      content = content.replace(/console\.error\(`([^`]+)`\)/g, "logger.error({ event: 'system_error' }, `$1`)");
      
      content = content.replace(/console\.log\('([^']+)', ([^)]+)\)/g, "logger.info({ event: 'system_log', data: $2 }, '$1')");
      content = content.replace(/console\.log\(`([^`]+)`, ([^)]+)\)/g, "logger.info({ event: 'system_log', data: $2 }, `$1`)");
      content = content.replace(/console\.log\('([^']+)'\)/g, "logger.info({ event: 'system_log' }, '$1')");
      content = content.replace(/console\.log\(`([^`]+)`\)/g, "logger.info({ event: 'system_log' }, `$1`)");

      content = content.replace(/console\.warn\('([^']+)', ([^)]+)\)/g, "logger.warn({ event: 'system_warn', data: $2 }, '$1')");
      content = content.replace(/console\.warn\(`([^`]+)`, ([^)]+)\)/g, "logger.warn({ event: 'system_warn', data: $2 }, `$1`)");
      content = content.replace(/console\.warn\('([^']+)'\)/g, "logger.warn({ event: 'system_warn' }, '$1')");
      content = content.replace(/console\.warn\(`([^`]+)`\)/g, "logger.warn({ event: 'system_warn' }, `$1`)");
      
      // Ensure logger is imported
      if (!content.includes('import logger')) {
        content = `import logger from '@/lib/logger';\n` + content;
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
}
