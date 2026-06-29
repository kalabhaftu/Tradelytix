const { Prisma } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const schemaDir = path.join(__dirname, '..', 'lib', 'db', 'schema');
if (!fs.existsSync(schemaDir)) {
  fs.mkdirSync(schemaDir, { recursive: true });
}

const dmmf = Prisma.dmmf;
const enums = dmmf.datamodel.enums;
const models = dmmf.datamodel.models;

const groups = {
  'accounts': ['Account', 'MasterAccount', 'PhaseAccount', 'LiveAccountTransaction', 'Payout'],
  'trades': ['Trade', 'TradeExecution', 'TradeTag'],
  'prop-firm': ['BreachRecord', 'DailyAnchor'],
  'journal': ['DailyNote', 'WeeklyReview', 'JournalTemplate'],
  'playbook': ['TradingModel', 'UserGoal', 'ActivityLog'],
  'backtest': ['BacktestTrade'],
  'ai': ['AIChat', 'AISavedInsight', 'WeeklyAIReview'],
  'dashboard': ['DashboardTemplate', 'AdminWidgetSetting', 'AdminDashboardPreset'],
  'users': ['User', 'UserSettings', 'Notification', 'ImportJob', 'Feedback', 'UserGeoLog', 'AdminFeatureFlag', 'AdminSharingPolicy', 'Synchronization', 'SharedReport', 'Subscription']
};

function getGroup(modelName) {
  for (const [group, ms] of Object.entries(groups)) {
    if (ms.includes(modelName)) return group;
  }
  return 'misc';
}

const mapType = (field) => {
  if (field.isList) {
    if (field.type === 'String') return 'text';
    if (field.type === 'Json') return 'jsonb';
    return 'jsonb';
  }
  switch (field.type) {
    case 'String': return 'text';
    case 'Int': return 'integer';
    case 'Float': return 'doublePrecision';
    case 'Boolean': return 'boolean';
    case 'DateTime': return "timestamp";
    case 'Json': return 'jsonb';
    case 'Bytes': return 'custom_bytes';
    default:
      if (field.kind === 'enum') return field.type;
      return 'text';
  }
};

const fileContents = {};
const relationsByGroup = {};

let enumsCode = `import { pgEnum } from 'drizzle-orm/pg-core';\n\n`;
for (const enm of enums) {
  const values = enm.values.map(v => `'${v.dbName || v.name}'`).join(', ');
  enumsCode += `export const ${enm.name}Enum = pgEnum('${enm.dbName || enm.name}', [${values}]);\n`;
}
fs.writeFileSync(path.join(schemaDir, 'enums.ts'), enumsCode);

for (const model of models) {
  const group = getGroup(model.name);
  if (!fileContents[group]) {
    fileContents[group] = {
      imports: new Set(['pgTable', 'uuid', 'text', 'integer', 'boolean', 'timestamp', 'jsonb', 'doublePrecision', 'json']),
      enumsToImport: new Set(),
      otherGroupsToImport: new Set(),
      code: '',
      relationsCode: ''
    };
  }
  
  const tableName = model.dbName || model.name;
  let code = `export const ${model.name} = pgTable('${tableName}', {\n`;
  
  for (const field of model.fields) {
    if (field.kind === 'object') continue;
    
    const colName = field.dbName || field.name;
    let drizzleType = mapType(field);
    let line = `  ${field.name}: `;
    
    if (field.kind === 'enum') {
      fileContents[group].enumsToImport.add(`${field.type}Enum`);
      line += `${field.type}Enum('${colName}')`;
    } else if (drizzleType === 'timestamp') {
      line += `timestamp('${colName}', { withTimezone: true, mode: 'date' })`;
    } else if (drizzleType === 'uuid' || (drizzleType === 'text' && colName === 'id' && field.isId)) {
       line += `text('${colName}')`;
       if (field.isId) line += `.primaryKey()`;
    } else if (drizzleType === 'custom_bytes') {
       fileContents[group].imports.add('customType');
       line += `customType<{ data: Buffer; driverData: Buffer }>({ dataType() { return 'bytea'; } })('${colName}')`;
    } else if (field.isList && drizzleType === 'text') {
       line += `text('${colName}').array()`;
    } else {
      line += `${drizzleType}('${colName}')`;
    }
    
    if (field.isId && drizzleType !== 'text' && drizzleType !== 'uuid') line += `.primaryKey()`;
    if (field.isRequired && !field.isId && !field.hasDefaultValue) line += `.notNull()`;
    if (field.isUnique) line += `.unique()`;
    if (field.hasDefaultValue) {
       if (typeof field.default === 'object' && field.default.name === 'now') line += `.defaultNow()`;
       else if (typeof field.default === 'object' && field.default.name === 'cuid') line += `.$defaultFn(() => crypto.randomUUID())`;
       else if (typeof field.default === 'object' && field.default.name === 'uuid') line += `.defaultRandom()`;
       else if (field.default !== undefined) {
         if (typeof field.default === 'string') line += `.default('${field.default}')`;
         else if (typeof field.default === 'boolean' || typeof field.default === 'number') line += `.default(${field.default})`;
         else if (Array.isArray(field.default)) line += `.default([${field.default.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')}])`;
       }
    }
    line += `,\n`;
    code += line;
  }
  
  code += `});\n\n`;
  code += `export type ${model.name}Type = typeof ${model.name}.$inferSelect;\n`;
  code += `export type New${model.name} = typeof ${model.name}.$inferInsert;\n\n`;
  fileContents[group].code += code;

  // Process relations
  let relationsCode = `export const ${model.name}Relations = relations(${model.name}, ({ one, many }) => ({\n`;
  let hasRelations = false;
  for (const field of model.fields) {
    if (field.kind !== 'object') continue;
    hasRelations = true;
    
    const targetGroup = getGroup(field.type);
    if (targetGroup !== group) {
      fileContents[group].otherGroupsToImport.add(targetGroup);
    }

    if (field.isList) {
      relationsCode += `  ${field.name}: many(${field.type}),\n`;
    } else {
      const relationFields = field.relationFromFields || [];
      const relationReferences = field.relationToFields || [];
      if (relationFields.length > 0) {
        relationsCode += `  ${field.name}: one(${field.type}, {\n`;
        relationsCode += `    fields: [${model.name}.${relationFields[0]}],\n`;
        relationsCode += `    references: [${field.type}.${relationReferences[0]}]\n`;
        relationsCode += `  }),\n`;
      } else {
         relationsCode += `  ${field.name}: one(${field.type}),\n`;
      }
    }
  }
  relationsCode += `}));\n\n`;
  
  if (hasRelations) {
    fileContents[group].imports.add('relations');
    fileContents[group].relationsCode += relationsCode;
  }
}

let indexExports = `export * from './enums';\n`;

for (const [group, data] of Object.entries(fileContents)) {
  const imp = Array.from(data.imports).join(', ');
  let fileText = `import { ${imp} } from 'drizzle-orm';\n`;
  fileText = fileText.replace('import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, doublePrecision, json, relations } from \'drizzle-orm\';', 'import { relations } from \'drizzle-orm\';\nimport { pgTable, uuid, text, integer, boolean, timestamp, jsonb, doublePrecision, json } from \'drizzle-orm/pg-core\';');
  fileText = fileText.replace('import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, doublePrecision, json } from \'drizzle-orm\';', 'import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, doublePrecision, json } from \'drizzle-orm/pg-core\';');
  
  // Actually let's just do imports cleanly
  let pgCoreImports = [];
  let ormImports = [];
  for (const i of data.imports) {
     if (i === 'relations') ormImports.push(i);
     else pgCoreImports.push(i);
  }
  fileText = '';
  if (ormImports.length) fileText += `import { ${ormImports.join(', ')} } from 'drizzle-orm';\n`;
  if (pgCoreImports.length) fileText += `import { ${pgCoreImports.join(', ')} } from 'drizzle-orm/pg-core';\n`;

  if (data.enumsToImport.size > 0) {
    fileText += `import { ${Array.from(data.enumsToImport).join(', ')} } from './enums';\n`;
  }
  
  if (data.otherGroupsToImport.size > 0) {
    for (const otherGroup of data.otherGroupsToImport) {
       // We can't do direct cross imports easily if there are circular dependencies.
       // Actually Drizzle allows circular dependencies if you are careful or import from the top level schema.
       // Let's import the specific tables from their group files.
       fileText += `import { ${models.filter(m => getGroup(m.name) === otherGroup).map(m => m.name).join(', ')} } from './${otherGroup}';\n`;
    }
  }

  // To avoid circular dependency issues in TypeScript with relations, Drizzle recommends importing everything from one big file or handling it carefully. We will let it be for now and fix if TSC complains.

  fileText += `\n${data.code}${data.relationsCode}`;
  fs.writeFileSync(path.join(schemaDir, `${group}.ts`), fileText);
  indexExports += `export * from './${group}';\n`;
}

fs.writeFileSync(path.join(schemaDir, 'index.ts'), indexExports);

console.log('Successfully generated Drizzle schema files with relations!');
