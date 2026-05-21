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

export const JOURNAL_EMOTION_LABELS: Record<JournalEmotion, string> = {
  confident: 'Confident',
  anxious: 'Anxious',
  focused: 'Focused',
  energetic: 'Energetic',
  calm: 'Calm',
  frustrated: 'Frustrated',
  optimistic: 'Optimistic',
  pessimistic: 'Pessimistic',
  disciplined: 'Disciplined',
  impulsive: 'Impulsive',
  happy: 'Happy',
  sad: 'Sad',
  neutral: 'Neutral',
  tired: 'Tired',
  excited: 'Excited',
  stressed: 'Stressed',
  relaxed: 'Relaxed',
}

export function isJournalEmotion(value: unknown): value is JournalEmotion {
  return typeof value === 'string' && (JOURNAL_EMOTIONS as readonly string[]).includes(value)
}

export function getJournalEmotionLabel(emotion: JournalEmotion) {
  return JOURNAL_EMOTION_LABELS[emotion]
}
