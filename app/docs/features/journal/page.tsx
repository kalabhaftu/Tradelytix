import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Image, Smile, CalendarDays, FileText } from 'lucide-react'

export default function JournalDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1>Journal & Daily Notes</h1>
        <p className="text-lg text-muted-foreground">
          Capture your thoughts, emotions, and analysis for every trading day with Deltalytix&apos;s rich-text journaling system.
        </p>
      </div>

      <h2>Overview</h2>
      <p>
        The journal is the heart of your trading discipline. Deltalytix provides a powerful rich-text editor powered by Lexical 
        that supports images, formatting, embeds, and more — all automatically saved and tied to your calendar.
      </p>

      <h2>How to Use</h2>
      <h3>1. Open the Journal</h3>
      <p>Click on any day in the <strong>Calendar</strong> widget on your dashboard, or navigate to the <strong>Daily Notes</strong> section. Each day gets its own journal entry.</p>

      <h3>2. Write Your Notes</h3>
      <p>The editor supports:</p>
      <ul>
        <li><strong>Rich text formatting</strong> — Bold, italic, underline, strikethrough, headings, lists</li>
        <li><strong>Image uploads</strong> — Paste or drag chart screenshots directly into the editor</li>
        <li><strong>Checklists</strong> — Track your pre-market routine or post-session review items</li>
        <li><strong>Code blocks</strong> — Useful for noting specific indicator settings or scripts</li>
      </ul>

      <h3>3. Attach Emotions</h3>
      <p>Tag your daily emotional state to track how psychology correlates with performance over time. Options include: Confident, Anxious, Neutral, FOMO, Disciplined, Frustrated, and more.</p>

      <h3>4. Review Past Entries</h3>
      <p>Navigate between days using the calendar. All journal entries are permanently saved and can be searched in the future.</p>

      <h2>Tips</h2>
      <ul>
        <li>Write your journal <em>before</em> checking P&L to capture unbiased thoughts</li>
        <li>Include screenshots of key setups — the editor handles image uploads natively</li>
        <li>Use the checklist feature for your daily routine (e.g., &quot;Checked calendar events&quot;, &quot;Identified bias&quot;)</li>
        <li>Review your journal weekly to spot behavioral patterns</li>
      </ul>
    </div>
  )
}
