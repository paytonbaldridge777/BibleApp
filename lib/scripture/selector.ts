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

type LocalScriptureTheme = ScriptureTheme & {
  tags: string[];
};

export function selectThemeForUser(
  profile: SpiritualProfile,
  feedbackHistory: GuidanceFeedback[]
): ScriptureTheme {
  const notRelevantGuidanceIds = new Set(
    feedbackHistory
      .filter((f) => f.feedback_type === 'not_relevant')
      .map((f) => f.guidance_id)
  );

  const helpfulGuidanceIds = new Set(
    feedbackHistory
      .filter((f) => f.feedback_type === 'helpful')
      .map((f) => f.guidance_id)
  );

  const desiredTags = new Set<string>();

  for (const need of profile.current_needs ?? []) {
    const tags = NEEDS_TO_TAGS[need] ?? [need];
    tags.forEach((t) => desiredTags.add(t));
  }

  for (const struggle of profile.main_struggles ?? []) {
    const tags = STRUGGLES_TO_TAGS[struggle] ?? [struggle];
    tags.forEach((t) => desiredTags.add(t));
  }

  const scored = (scriptureThemes as LocalScriptureTheme[]).map((theme) => {
    let score = 0;

    const matchCount = theme.tags.filter((t) => desiredTags.has(t)).length;
    score += matchCount * 10;

    // These are guidance IDs, not theme IDs, so don't use them for scoring theme matches.
    // Keeping the sets here only so the feedback model remains aligned if reused later.
    void notRelevantGuidanceIds;
    void helpfulGuidanceIds;

    score += Math.random() * 3;

    return { theme, score };
  });

  const candidates = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    const topN = candidates.slice(0, Math.min(5, candidates.length));
    return topN[Math.floor(Math.random() * topN.length)].theme;
  }

  return scriptureThemes[Math.floor(Math.random() * scriptureThemes.length)];
}