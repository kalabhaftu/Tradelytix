export const JOURNAL_EMOTIONS = [
  'confident',
  'anxious',
  'focused',
  'energetic',
  'calm',
  'frustrated',
  'optimistic',
  'pessimistic',
  'disciplined',
  'impulsive',
  'happy',
  'sad',
  'neutral',
  'tired',
  'excited',
  'stressed',
  'relaxed',
] as const

export type JournalEmotion = (typeof JOURNAL_EMOTIONS)[number]

export function isJournalEmotion(value: unknown): value is JournalEmotion {
  return typeof value === 'string' && (JOURNAL_EMOTIONS as readonly string[]).includes(value)
}

