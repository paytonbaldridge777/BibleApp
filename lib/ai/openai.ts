import OpenAI from 'openai';
import type { ScriptureTheme, SpiritualProfile, OnboardingAnswers } from '@/types';
import { buildGuidanceSystemPrompt, buildProfileSummaryPrompt } from './prompts';

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key') return null;
  return new OpenAI({ apiKey });
}

function buildFallbackGuidance(
  theme: ScriptureTheme,
  profile: SpiritualProfile
): { devotional: string; prayer: string; reflection: string } {
  const firstNeed = profile.current_needs?.[0] ?? 'guidance';
  const toneWord =
    profile.tone_preference === 'gentle'
      ? 'gently encourages'
      : profile.tone_preference === 'uplifting'
      ? 'uplifts'
      : 'invites';

  return {
    devotional: `Today's reflection on ${theme.theme}: "${theme.verse_text}" — ${theme.verse_reference}. ${theme.short_explanation} Take a moment to sit with this verse and consider how it speaks to your current situation.`,
    prayer: `Lord, as I reflect on ${theme.verse_reference}, I come to You seeking ${firstNeed}. This verse ${toneWord} me to trust You more deeply. Help me to carry its truth with me throughout this day. Amen.`,
    reflection: `Today, consider one practical way you can apply this truth: ${theme.short_explanation} Write it down or share it with someone you trust.`,
  };
}

export async function generateDailyGuidance(params: {
  theme: ScriptureTheme;
  profile: SpiritualProfile;
  today: string;
}): Promise<{ devotional: string; prayer: string; reflection: string }> {
  const client = getOpenAIClient();

  if (!client) {
    return buildFallbackGuidance(params.theme, params.profile);
  }

  try {
    const systemPrompt = buildGuidanceSystemPrompt(params.theme, params.profile);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Please generate today's (${params.today}) devotional, prayer, and reflection based on the grounding verse.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return buildFallbackGuidance(params.theme, params.profile);

    const parsed = JSON.parse(content) as {
      devotional?: string;
      prayer?: string;
      reflection?: string;
    };

    if (!parsed.devotional || !parsed.prayer || !parsed.reflection) {
      return buildFallbackGuidance(params.theme, params.profile);
    }

    return {
      devotional: parsed.devotional,
      prayer: parsed.prayer,
      reflection: parsed.reflection,
    };
  } catch (error) {
    console.error('OpenAI guidance generation failed:', error);
    return buildFallbackGuidance(params.theme, params.profile);
  }
}

export async function generateProfileSummary(answers: OnboardingAnswers): Promise<string> {
  const client = getOpenAIClient();

  if (!client) {
    const needs = answers.seeking.slice(0, 2).join(' and ');
    const struggles = answers.struggles.slice(0, 1)[0] ?? 'reading the Bible';
    return `You are on a meaningful spiritual journey, seeking ${needs || 'growth and peace'}. You've shared that ${struggles} can be a challenge, and that's completely normal. This community is here to walk alongside you with encouragement rooted in Scripture.`;
  }

  try {
    const prompt = buildProfileSummaryPrompt({
      struggles: answers.struggles,
      seeking: answers.seeking,
      familiarity: answers.familiarity,
      tone: answers.tone,
      free_text: answers.free_text,
    });

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 200,
    });

    return (
      response.choices[0]?.message?.content?.trim() ??
      'You are on a meaningful spiritual journey, seeking God\'s guidance and presence.'
    );
  } catch (error) {
    console.error('OpenAI profile summary failed:', error);
    const needs = answers.seeking.slice(0, 2).join(' and ');
    return `You are on a meaningful spiritual journey, seeking ${needs || 'growth and peace'}. Scripture will be your guide as you take this step forward.`;
  }
}
