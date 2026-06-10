import { PrismaClient } from '@prisma/client'
import { config as loadEnvFile } from 'dotenv'
import path from 'path'
import { DEFAULT_TEMPLATE_LAYOUT } from '../lib/dashboard/default-template-layout'

loadEnvFile({ path: path.join(process.cwd(), '.env') })
loadEnvFile({ path: path.join(process.cwd(), '.env.local'), override: true })

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL
}

const prisma = new PrismaClient()

async function main() {
  console.log('Starting default template updates in database...')

  const result = await prisma.dashboardTemplate.updateMany({
    where: {
      isDefault: true
    },
    data: {
      layout: DEFAULT_TEMPLATE_LAYOUT as any,
      updatedAt: new Date()
    }
  })

  console.log(`Updated ${result.count} default templates in the database.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
