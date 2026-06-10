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
  const targetUserId = '7795bbfe-2326-4a0e-ad0b-0864ac2fd11b'

  const slimTemplate = await prisma.dashboardTemplate.findFirst({
    where: {
      userId: targetUserId,
      name: 'Slim'
    }
  })

  if (!slimTemplate) {
    console.error('Slim template not found in database for user:', targetUserId)
    return
  }

  const databaseLayout = slimTemplate.layout as any[]
  console.log(`Database Slim Layout length: ${databaseLayout.length}`)
  console.log(`Code DEFAULT_TEMPLATE_LAYOUT length: ${DEFAULT_TEMPLATE_LAYOUT.length}`)

  console.log('\n--- Side-by-side Comparison ---')
  const dbMap = new Map<string, any>()
  databaseLayout.forEach(w => dbMap.set(w.type, w))

  const codeMap = new Map<string, any>()
  DEFAULT_TEMPLATE_LAYOUT.forEach(w => codeMap.set(w.type, w))

  const allTypes = Array.from(new Set([...dbMap.keys(), ...codeMap.keys()]))

  for (const type of allTypes) {
    const dbWidget = dbMap.get(type)
    const codeWidget = codeMap.get(type)

    if (dbWidget && codeWidget) {
      const isMatch = dbWidget.x === codeWidget.x &&
                      dbWidget.y === codeWidget.y &&
                      dbWidget.w === codeWidget.w &&
                      dbWidget.h === codeWidget.h &&
                      dbWidget.size === codeWidget.size

      if (!isMatch) {
        console.log(`[MISMATCH] Type: "${type}"`)
        console.log(`  Database: size=${dbWidget.size}, x=${dbWidget.x}, y=${dbWidget.y}, w=${dbWidget.w}, h=${dbWidget.h}`)
        console.log(`  Code:     size=${codeWidget.size}, x=${codeWidget.x}, y=${codeWidget.y}, w=${codeWidget.w}, h=${codeWidget.h}`)
      } else {
        console.log(`[OK]       Type: "${type}"`)
      }
    } else if (dbWidget) {
      console.log(`[ONLY IN DB] Type: "${type}"`)
      console.log(`  Database: size=${dbWidget.size}, x=${dbWidget.x}, y=${dbWidget.y}, w=${dbWidget.w}, h=${dbWidget.h}`)
    } else if (codeWidget) {
      console.log(`[ONLY IN CODE] Type: "${type}"`)
      console.log(`  Code:     size=${codeWidget.size}, x=${codeWidget.x}, y=${codeWidget.y}, w=${codeWidget.w}, h=${codeWidget.h}`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
