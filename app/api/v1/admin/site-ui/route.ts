import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/server/admin-auth'
import { getSiteUiSettings, updateSiteUiSettings } from '@/server/site-ui-settings'

export async function GET() {
  try {
    await requireAdmin()
    const settings = await getSiteUiSettings()
    return NextResponse.json({ success: true, data: settings })
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const settings = await updateSiteUiSettings({
      showDonateButton:
        typeof body.showDonateButton === 'boolean' ? body.showDonateButton : undefined,
      showFeedbackButton:
        typeof body.showFeedbackButton === 'boolean' ? body.showFeedbackButton : undefined,
    })

    return NextResponse.json({ success: true, data: settings })
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
}
