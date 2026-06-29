const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const apiKey = process.env.XAI_API_KEY;
const baseUrl = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
const model = process.env.XAI_MODEL || 'grok-beta'; // fallback if not set

if (!apiKey) {
  console.error("XAI_API_KEY is not set.");
  process.exit(1);
}

const files = fs.readFileSync(path.join(__dirname, '..', 'prisma_files.txt'), 'utf8')
  .split('\n')
  .map(f => f.trim())
  .filter(f => f && fs.existsSync(path.join(__dirname, '..', f)));

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function migrateFile(filePath) {
  const absolutePath = path.join(__dirname, '..', filePath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  
  if (!content.includes('prisma') && !content.includes('@prisma/client')) {
    return true; // Already migrated or false positive
  }

  const prompt = `You are a strict, expert codemod script translating a Next.js application from Prisma to Drizzle ORM.

Translate the following TypeScript/TSX file.
RULES:
1. Replace Prisma imports (like \`import { prisma } from '@/lib/prisma'\` or \`@prisma/client\`) with:
   \`import { db } from '@/lib/db/client';\`
   \`import * as schema from '@/lib/db/schema';\`
   (Only import \`schema\` if needed for inserts/updates).
2. For queries, translate exactly to Drizzle Relational Queries where possible:
   - \`prisma.model.findUnique({ where: { id: val } })\` -> \`await db.query.Model.findFirst({ where: (table, { eq }) => eq(table.id, val) })\` (Note: Capitalize the model name in db.query!)
   - \`prisma.model.findMany({ where: { field: val } })\` -> \`await db.query.Model.findMany({ where: (table, { eq }) => eq(table.field, val) })\`
   - \`prisma.model.create({ data: { ... } })\` -> \`(await db.insert(schema.model).values({ ... }).returning())[0]\` (Note: schema models are Capitalized like schema.Trade)
   - \`prisma.model.update({ where: { id: val }, data: { ... } })\` -> \`(await db.update(schema.model).set({ ... }).where(eq(schema.model.id, val)).returning())[0]\`
   - \`prisma.model.delete({ where: { id: val } })\` -> \`(await db.delete(schema.model).where(eq(schema.model.id, val)).returning())[0]\`
   - \`include: { Relations: true }\` -> \`with: { Relations: true }\`
   - \`orderBy: { createdAt: 'desc' }\` -> \`orderBy: (table, { desc }) => [desc(table.createdAt)]\`
3. You must import \`eq, and, or, inArray, desc, asc\` from \`drizzle-orm\` if you use them outside of relational queries (i.e. in \`db.update\`, \`db.delete\`, \`db.insert\`).
4. Output ONLY the raw TypeScript code. NO markdown formatting, NO \`\`\`ts or \`\`\` wrapping. Just the code. DO NOT ADD ANY EXPLANATION.

File Path: ${filePath}

Code:
${content}
`;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      })
    });
    
    if (!res.ok) {
      console.error(`Error migrating ${filePath}: ${res.statusText}`);
      const text = await res.text();
      console.error(text);
      return false;
    }

    const data = await res.json();
    let newContent = data.choices[0].message.content;
    
    // strip markdown if it accidentally added it
    if (newContent.startsWith('\`\`\`')) {
      const lines = newContent.split('\\n');
      lines.shift();
      if (lines[lines.length - 1].startsWith('\`\`\`')) lines.pop();
      newContent = lines.join('\\n');
    }
    
    fs.writeFileSync(absolutePath, newContent);
    console.log(`Successfully migrated ${filePath}`);
    return true;
  } catch (err) {
    console.error(`Exception migrating ${filePath}: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log(`Starting migration of ${files.length} files...`);
  
  // We'll process them with concurrency of 3 to avoid extreme rate limits
  const CONCURRENCY = 3;
  
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const chunk = files.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(file => migrateFile(file)));
    await delay(1000); // 1s delay between batches
  }
  
  console.log('Migration complete!');
}

run();
