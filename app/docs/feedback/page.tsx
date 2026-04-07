import Link from 'next/link'

export default function FeedbackGuideDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1>Feedback Guide</h1>
        <p className="text-lg text-muted-foreground">How to submit effective feedback and bug reports.</p>
      </div>

      <h2>Where to Submit</h2>
      <p>You can submit feedback in two ways:</p>
      <ul>
        <li><strong>Public feedback page</strong> — <Link href="/feedback" className="text-primary hover:underline">/feedback</Link> (no login required)</li>
        <li><strong>Dashboard sidebar</strong> — Click the &quot;Feedback&quot; item (auto-fills your info)</li>
      </ul>

      <h2>What to Include</h2>
      <h3>Bug Reports</h3>
      <ul>
        <li>Steps to reproduce the issue</li>
        <li>What you expected to happen</li>
        <li>What actually happened</li>
        <li>Screenshots if possible (drag-and-drop supported)</li>
        <li>Browser + OS information</li>
      </ul>

      <h3>Feature Requests</h3>
      <ul>
        <li>Describe the problem you&apos;re trying to solve</li>
        <li>Explain your ideal solution</li>
        <li>Mention any alternatives you&apos;ve considered</li>
      </ul>

      <h2>Response Times</h2>
      <p>Feedback is reviewed regularly. If you&apos;re logged in when you submit, you&apos;ll receive a notification when an admin responds.</p>
    </div>
  )
}
