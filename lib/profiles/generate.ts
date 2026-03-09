import type { OnboardingAnswers, SpiritualProfileData } from '@/types';

const CAUTION_KEYWORDS = [
  'addiction',
  'grief',
  'anxiety',
  'depression',
  'abuse',
  'suicid',
  'harm',
  'crisis',
];

export function generateSpiritualProfile(answers: OnboardingAnswers): SpiritualProfileData {
  const cautionFlagsFound: string[] = [];

  if (answers.free_text) {
    const lower = answers.free_text.toLowerCase();
    for (const keyword of CAUTION_KEYWORDS) {
      if (lower.includes(keyword)) {
        cautionFlagsFound.push(keyword);
      }
    }
  }

  const levelMap: Record<string, string> = {
    beginner: 'beginner',
    intermediate: 'intermediate',
    advanced: 'advanced',
  };

  const profileSummaryParts: string[] = [];

  const experienceLabel =
    answers.familiarity === 'beginner'
      ? 'just starting their Bible journey'
      : answers.familiarity === 'advanced'
      ? 'an experienced Bible reader'
      : 'someone with some Bible familiarity';

  profileSummaryParts.push(`You are ${experienceLabel}`);

  if (answers.seeking.length > 0) {
    const topNeeds = answers.seeking.slice(0, 3).join(', ');
    profileSummaryParts.push(`currently seeking ${topNeeds}`);
  }

  if (answers.struggles.length > 0) {
    const topStruggle = answers.struggles[0].replace(/-/g, ' ');
    profileSummaryParts.push(`with a desire to grow in ${topStruggle}`);
  }

  const profile_summary = profileSummaryParts.join(', ') + '. Scripture will guide you each day.';

  return {
    bible_experience_level: levelMap[answers.familiarity] ?? 'intermediate',
    main_struggles: answers.struggles,
    current_needs: answers.seeking,
    preferred_content_types: answers.content_types,
    tone_preference: answers.tone,
    devotional_length: answers.devotional_length,
    profile_summary,
    caution_flags: cautionFlagsFound,
  };
}
