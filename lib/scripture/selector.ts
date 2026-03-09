import type { ScriptureTheme, SpiritualProfile, GuidanceFeedback } from '@/types';
import { scriptureThemes } from './themes';

const NEEDS_TO_TAGS: Record<string, string[]> = {
  peace: ['peace', 'anxiety', 'worry'],
  hope: ['hope', 'future', 'endurance'],
  'spiritual-growth': ['spiritual-growth', 'growth', 'maturity', 'applying-to-daily-life'],
  strength: ['strength', 'courage', 'perseverance', 'endurance'],
  wisdom: ['wisdom', 'guidance', 'knowing-where-to-start', 'direction'],
  healing: ['healing', 'grief', 'restoration', 'brokenness'],
  'freedom-from-addiction': ['freedom-from-addiction', 'temptation', 'self-control'],
  'anxiety-relief': ['anxiety', 'anxiety-relief', 'peace', 'worry'],
  forgiveness: ['forgiveness', 'grace', 'healing'],
  purpose: ['purpose', 'identity', 'meaning'],
};

const STRUGGLES_TO_TAGS: Record<string, string[]> = {
  'finding-relevant-verses': ['guidance', 'knowing-where-to-start'],
  'understanding-meaning': ['wisdom', 'understanding'],
  'staying-consistent': ['perseverance', 'staying-consistent', 'spiritual-growth'],
  'knowing-where-to-start': ['guidance', 'knowing-where-to-start', 'direction'],
  'applying-to-daily-life': ['applying-to-daily-life', 'renewal', 'practical'],
};

export function selectThemeForUser(
  profile: SpiritualProfile,
  feedbackHistory: GuidanceFeedback[]
): ScriptureTheme {
  const notRelevantIds = new Set(
    feedbackHistory
      .filter((f) => f.feedback_type === 'not_relevant')
      .map((f) => f.guidance_id)
  );

  const helpfulThemeIds = new Set(
    feedbackHistory
      .filter((f) => f.feedback_type === 'helpful' || f.feedback_type === 'favorite')
      .map((f) => f.guidance_id)
  );

  // Build desired tags from user profile
  const desiredTags = new Set<string>();
  for (const need of profile.current_needs ?? []) {
    const tags = NEEDS_TO_TAGS[need] ?? [need];
    tags.forEach((t) => desiredTags.add(t));
  }
  for (const struggle of profile.main_struggles ?? []) {
    const tags = STRUGGLES_TO_TAGS[struggle] ?? [struggle];
    tags.forEach((t) => desiredTags.add(t));
  }

  // Score each theme
  const scored = scriptureThemes.map((theme) => {
    if (notRelevantIds.has(theme.id)) return { theme, score: -999 };

    let score = 0;
    const matchCount = theme.tags.filter((t) => desiredTags.has(t)).length;
    score += matchCount * 10;

    if (helpfulThemeIds.has(theme.id)) score += 5;

    // Add randomness
    score += Math.random() * 3;

    return { theme, score };
  });

  const candidates = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    // Pick randomly from top 5 candidates
    const topN = candidates.slice(0, Math.min(5, candidates.length));
    return topN[Math.floor(Math.random() * topN.length)].theme;
  }

  // Fallback: random theme
  return scriptureThemes[Math.floor(Math.random() * scriptureThemes.length)];
}
