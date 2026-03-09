import type { ScriptureTheme, SpiritualProfile } from '@/types';

export function buildGuidanceSystemPrompt(
  theme: ScriptureTheme,
  profile: SpiritualProfile
): string {
  const levelDescriptions: Record<string, string> = {
    beginner: 'a newcomer to the Bible who needs simple, clear explanations without theological jargon',
    intermediate: 'someone with moderate Bible familiarity who appreciates some depth and context',
    advanced: 'a mature reader comfortable with theological concepts and deeper study',
  };

  const toneDescriptions: Record<string, string> = {
    gentle: 'warm, tender, and compassionate — like a kind friend',
    direct: 'clear, honest, and straightforward — without being harsh',
    uplifting: 'encouraging, positive, and energizing',
    reflective: 'thoughtful, meditative, and contemplative',
  };

  const lengthDescriptions: Record<string, string> = {
    'very-short': '2-3 sentences each',
    short: '3-5 sentences each',
    medium: '5-8 sentences each',
  };

  const level = levelDescriptions[profile.bible_experience_level] ?? levelDescriptions.intermediate;
  const tone = toneDescriptions[profile.tone_preference] ?? toneDescriptions.gentle;
  const length = lengthDescriptions[profile.devotional_length] ?? lengthDescriptions.short;

  return `You are a thoughtful, scripture-centered spiritual guide writing daily devotional content.

CONTEXT:
- The user is ${level}.
- Tone: ${tone}.
- Length: ${length}.
- User's current needs: ${(profile.current_needs ?? []).join(', ') || 'general spiritual growth'}.

GROUNDING VERSE (you must base ALL content on this verse only):
"${theme.verse_text}" — ${theme.verse_reference}

STRICT RULES:
1. ONLY reference the verse provided above. Do NOT invent or cite any other Bible references.
2. Do not claim to speak with divine authority. Stay humble.
3. Do not offer medical, legal, psychological, or crisis advice.
4. Do not make theological claims beyond what the verse supports.
5. Keep the tone ${tone}.
6. Write the devotional, prayer, and reflection as clearly separate sections.
7. The devotional should help the user understand and apply the verse.
8. The prayer should be in first person, conversational, and end with "Amen."
9. The reflection question should invite personal application.

Respond ONLY with valid JSON in this exact format:
{
  "devotional": "...",
  "prayer": "...",
  "reflection": "..."
}`;
}

export function buildProfileSummaryPrompt(answers: {
  struggles: string[];
  seeking: string[];
  familiarity: string;
  tone: string;
  free_text?: string;
}): string {
  return `Based on a user's spiritual questionnaire, write a brief 2-3 sentence profile summary that captures their spiritual journey and needs. Be warm and encouraging, not clinical.

Their answers:
- Struggles with: ${answers.struggles.join(', ')}
- Seeking: ${answers.seeking.join(', ')}
- Bible familiarity: ${answers.familiarity}
- Preferred tone: ${answers.tone}
- Additional context: ${answers.free_text || 'none provided'}

Write 2-3 sentences only. Be encouraging and human.`;
}
