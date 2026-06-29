const fs = require('fs');
const path = require('path');

const filePaths = [
  'app/dashboard/journal/components/trade-card.tsx',
  'app/dashboard/journal/components/journal-calendar.tsx',
  'app/dashboard/journal/components/journal-client.tsx',
  'app/dashboard/types/calendar.ts',
  'app/dashboard/components/tables/virtualized-trade-table.tsx',
  'app/dashboard/components/tables/trade-detail-panel.tsx',
  'app/dashboard/components/tables/trade-table-review.tsx',
  'app/dashboard/components/tables/trade-edit-panel.tsx',
  'app/dashboard/components/calendar/weekly-modal.tsx',
  'app/dashboard/components/calendar/calendar-utils.ts',
  'app/dashboard/components/import/match-trader/match-trader-processor.tsx',
  'app/dashboard/components/import/import-button.tsx',
  'app/dashboard/components/import/universal/universal-processor.tsx',
  'app/dashboard/components/import/config/platforms.tsx',
  'app/dashboard/components/import/config/platforms-card.tsx',
  'app/dashboard/components/import/manual-trade-entry/manual-trade-form.tsx',
  'app/dashboard/components/import/manual-trade-entry/manual-trade-form-card.tsx',
  'app/dashboard/components/import/tradovate/sync/actions.ts',
  'app/dashboard/components/import/tradovate/tradovate-processor.tsx',
  'app/dashboard/components/import/rithmic/rithmic-performance-processor.tsx',
  'app/dashboard/components/import/rithmic/rithmic-order-processor-new.tsx',
  'app/dashboard/components/import/components/format-preview.tsx',
  'app/dashboard/components/import/dxfeed/sync/dxfeed-types.ts',
  'app/dashboard/components/import/import-trades-card.tsx',
  'app/dashboard/components/import/exness/exness-processor.tsx',
  'app/dashboard/data/components/data-management/trade-table.tsx',
  'app/dashboard/data/components/data-management/data-management-card.tsx',
  'app/api/v1/admin/feedback/[id]/route.ts',
  'app/api/v1/admin/free-access/route.ts',
  'app/api/v1/admin/promo-codes/route.ts',
  'lib/statistics/report-statistics.ts',
  'lib/statistics/server-statistics.ts',
  'lib/statistics/propfirm-statistics.ts',
  'lib/metrics/pnl.ts',
  'lib/database/batch-operations.ts',
  'lib/user-settings.ts',
  'lib/trade-counts.ts',
  'lib/utils.ts',
  'lib/utils/balance-calculator.ts',
  'lib/activity-logger.ts',
  'lib/dashboard/analytics-calculations.ts',
  'lib/error-logger.ts',
  'lib/csv/universal-csv-processor.ts',
  'lib/trade-core.ts',
  'lib/prop-firm/reporting.ts',
  'lib/prop-firm/phase-evaluation-engine.ts',
  'lib/trade-factory.ts',
  'lib/services/subscription-guard-service.ts',
  'lib/services/anchor-service.ts',
  'lib/services/notification-service.ts',
  'lib/services/maintenance-service.ts',
  'lib/services/subscription-service.ts',
  'lib/services/ai-guard-service.ts',
  'lib/services/phase-service.ts',
  'lib/validation/phase-id-validator.ts',
  'server/user-data.ts',
  'server/notifications.ts',
  'server/database.ts',
  'server/accounts.ts',
  'server/services/notification-service.ts',
  'server/auth.ts',
  'server/geolocation.ts',
  'server/admin-subscription-state.ts',
  'components/prop-firm/phase-transition-approval-dialog.tsx',
  'components/prop-firm/funded-approval-dialog.tsx',
  'components/notifications/notification-item.tsx',
  'components/notifications/adjust-date-dialog.tsx',
  'components/notifications/notification-center.tsx',
  'scripts/user-management.ts',
  'scripts/update-default-templates.ts',
  'scripts/cleanup-orphaned-users.ts',
  'scripts/compare-templates.ts',
  'scripts/backfill-auto-adjust-account-dates.ts',
  'scripts/backfill-trade-core-refactor.ts',
  'scripts/audit-orphans.ts'
];

const modelMap = {
  User: { export: 'UserType', file: 'users' },
  Trade: { export: 'TradeType', file: 'trades' },
  Account: { export: 'AccountType', file: 'accounts' },
  LiveAccountTransaction: { export: 'LiveAccountTransactionType', file: 'accounts' },
  PhaseAccount: { export: 'PhaseAccountType', file: 'accounts' },
  TradeExecution: { export: 'TradeExecutionType', file: 'trades' },
  TradeTag: { export: 'TradeTagType', file: 'trades' },
  DailyNote: { export: 'DailyNoteType', file: 'journal' },
  Notification: { export: 'NotificationType', file: 'users' },
  Subscription: { export: 'SubscriptionType', file: 'users' },
  ImportJob: { export: 'ImportJobType', file: 'users' },
  Feedback: { export: 'FeedbackType', file: 'users' },
  UserSettings: { export: 'UserSettingsType', file: 'users' },
};

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;

  // Find Prisma imports
  const prismaImportRegex = /import\s+type\s+\{([^}]+)\}\s+from\s+['"]@prisma\/client['"]/g;
  const prismaImportMatch = /import\s+\{([^}]+)\}\s+from\s+['"]@prisma\/client['"]/g;
  
  let newImports = new Set();
  
  function replaceImport(match, importsStr) {
    const imports = importsStr.split(',').map(i => i.trim()).filter(Boolean);
    const filesToImports = {};

    imports.forEach(imp => {
      // Handle aliased imports: 'Trade as PrismaTrade'
      let typeName = imp.split(' as ')[0].trim();
      let map = modelMap[typeName];
      
      if (map) {
        if (!filesToImports[map.file]) filesToImports[map.file] = [];
        // Replace in content: find exact matches of 'typeName' as type
        const typeRegex = new RegExp(`\\b${typeName}\\b`, 'g');
        content = content.replace(typeRegex, map.export);
        filesToImports[map.file].push(map.export);
      }
    });

    let replacement = '';
    for (const [file, exports] of Object.entries(filesToImports)) {
      replacement += `import type { ${[...new Set(exports)].join(', ')} } from '@/lib/db/schema/${file}';\n`;
    }
    return replacement;
  }

  content = content.replace(prismaImportRegex, replaceImport);
  content = content.replace(prismaImportMatch, replaceImport);
  
  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Replaced types in ${filePath}`);
  }
}

filePaths.forEach(processFile);
