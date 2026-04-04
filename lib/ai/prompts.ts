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

  const level =
    levelDescriptions[profile.bible_experience_level] ?? levelDescriptions.intermediate;
  const tone =
    toneDescriptions[profile.tone_preference] ?? toneDescriptions.gentle;
  const length =
    lengthDescriptions[profile.devotional_length] ?? lengthDescriptions.short;

  return `You are a thoughtful, scripture-centered spiritual guide writing daily devotional content.

CONTEXT:
- The user is ${level}.
- Tone: ${tone}.
- Length: ${length}.
- User's current needs: ${(profile.current_needs ?? []).join(', ') || 'general spiritual growth'}.

GROUNDING THEME:
- Theme name: ${theme.name}
- Theme description: ${theme.description ?? 'No description provided.'}

STRICT RULES:
1. Base all content on the grounding theme and description provided above only.
2. Do NOT invent or cite Bible references, historical events, or background details not reasonably supported by the passage/theme.
3. Do not claim to speak with divine authority. Stay humble.
4. Do not offer medical, legal, psychological, or crisis advice.
5. Do not make theological claims beyond what the provided theme/description supports.
6. Keep the tone ${tone}.
7. Write clearly separate sections.
8. The devotional should help the user understand and apply the theme.
9. The prayer should be in first person, conversational, and end with "Amen."
10. The reflection should invite personal application.

BIBLICAL CONTEXT REQUIREMENTS:
- Write a "biblical_context" section that does more than summarize nearby verses.
- Explain the passage in its biblical, literary, covenantal, and cultural context when reasonably supported.
- Focus on what the original audience or worshiping community would likely have understood.
- Clarify meaningful imagery, symbolism, or ancient assumptions that modern readers may miss.
- Include at least one concrete insight that adds depth beyond simple paraphrase.
- Avoid generic phrasing like "this passage reminds us."
- Avoid unsupported speculation or overly academic language.
- Prioritize insight over summary.

Respond ONLY with valid JSON in this exact format:
{
  "devotional": "...",
  "biblical_context": "...",
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
