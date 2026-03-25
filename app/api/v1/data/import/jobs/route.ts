import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { createImportJob } from '@/server/import-jobs'
import { applyRateLimit, importLimiter } from '@/lib/rate-limiter'

const MAX_IMPORT_FILE_BYTES = 50 * 1024 * 1024

export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, importLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ success: false, error: 'Only ZIP backup files are supported' }, { status: 400 })
    }

    if (file.size <= 0) {
      return NextResponse.json({ success: false, error: 'File is empty' }, { status: 400 })
    }

    if (file.size > MAX_IMPORT_FILE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Backup file is too large. Max supported size is ${Math.floor(MAX_IMPORT_FILE_BYTES / (1024 * 1024))}MB`,
        },
        { status: 413 },
      )
    }

    const fileData = await file.arrayBuffer()

    const job = await createImportJob({
      internalUserId: identity.internalUserId,
      fileName: file.name,
      fileSize: file.size,
      fileData,
    })

    return NextResponse.json({ success: true, job }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create import job'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
