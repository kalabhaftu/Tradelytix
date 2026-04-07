import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, feedbackLimiter } from '@/lib/rate-limiter'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { extractIP } from '@/server/geolocation'
import { logServerError } from '@/lib/error-logger'

const ALLOWED_FILE_TYPES = [
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf', 'text/csv', 'text/plain',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.sh', '.js', '.php', '.dll', '.cmd', '.ps1', '.vbs', '.msi']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  const rl = await applyRateLimit(req, feedbackLimiter)
  if (rl) return rl

  try {
    const formData = await req.formData()

    const category = formData.get('category') as string
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string
    const name = formData.get('name') as string | null
    const email = formData.get('email') as string | null

    if (!category || !subject || !message) {
      return NextResponse.json({ success: false, error: 'category, subject, and message are required' }, { status: 400 })
    }

    if (!['BUG_REPORT', 'FEATURE_REQUEST', 'GENERAL', 'OTHER'].includes(category)) {
      return NextResponse.json({ success: false, error: 'Invalid category' }, { status: 400 })
    }

    if (subject.length > 200) {
      return NextResponse.json({ success: false, error: 'Subject too long (max 200 chars)' }, { status: 400 })
    }

    if (message.length > 5000) {
      return NextResponse.json({ success: false, error: 'Message too long (max 5000 chars)' }, { status: 400 })
    }

    // Process file attachments
    const attachments: Array<{ name: string; size: number; type: string; url: string }> = []
    const files = formData.getAll('files') as File[]

    if (files.length > 3) {
      return NextResponse.json({ success: false, error: 'Maximum 3 files allowed' }, { status: 400 })
    }

    for (const file of files) {
      if (!(file instanceof File) || file.size === 0) continue

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: `File ${file.name} exceeds 5MB limit` }, { status: 400 })
      }

      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (BLOCKED_EXTENSIONS.includes(ext)) {
        return NextResponse.json({ success: false, error: `File type ${ext} is not allowed` }, { status: 400 })
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
        return NextResponse.json({ success: false, error: `File type ${file.type} is not allowed` }, { status: 400 })
      }

      // Upload to Supabase Storage
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const buffer = Buffer.from(await file.arrayBuffer())

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('feedback-attachments')
          .upload(fileName, buffer, { contentType: file.type })

        if (uploadError) {
          console.error('[Feedback] Upload error:', uploadError)
          continue
        }

        const { data: urlData } = supabase.storage
          .from('feedback-attachments')
          .getPublicUrl(fileName)

        attachments.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData.publicUrl,
        })
      } catch (uploadErr) {
        console.error('[Feedback] File upload failed:', uploadErr)
      }
    }

    // Resolve user identity (optional — may be anonymous)
    const identity = await getResolvedUserIdentitySafe()
    const ip = extractIP(req.headers)
    const userAgent = req.headers.get('user-agent') || undefined

    // Simple IP geo lookup for feedback
    let country: string | undefined
    let city: string | undefined
    let region: string | undefined
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,regionName`, { signal: AbortSignal.timeout(2000) })
      if (geoRes.ok) {
        const geo = await geoRes.json()
        country = geo.country
        city = geo.city
        region = geo.regionName
      }
    } catch {}

    const feedback = await prisma.feedback.create({
      data: {
        userId: identity?.internalUserId,
        name: name || undefined,
        email: email || undefined,
        category: category as any,
        subject: subject.slice(0, 200),
        message: message.slice(0, 5000),
        attachments: attachments.length > 0 ? attachments : undefined,
        ipAddress: ip,
        userAgent,
        country,
        city,
        region,
      },
    })

    return NextResponse.json({ success: true, data: { id: feedback.id } })
  } catch (error: any) {
    await logServerError(error, { url: req.url, source: 'API' })
    return NextResponse.json({ success: false, error: 'Failed to submit feedback' }, { status: 500 })
  }
}
