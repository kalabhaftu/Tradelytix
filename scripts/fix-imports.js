const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/api/v1/dxfeed/sync/route.ts',
  'app/api/v1/dxfeed/synchronizations/route.ts',
  'app/api/v1/feedback/route.ts',
  'app/api/v1/rithmic/synchronizations/route.ts',
  'app/api/v1/tradovate/sync/route.ts',
  'app/api/v1/tradovate/synchronizations/route.ts',
  'app/dashboard/components/import/dxfeed/sync/actions.ts',
  'lib/utils/fetch-with-error.ts'
];

filesToFix.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove all instances of the logger import
    content = content.replace(/import \{ logger \} from '@\/lib\/logger';\n/g, '');
    
    // Add it exactly once at the top
    content = "import { logger } from '@/lib/logger';\n" + content;
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
});
