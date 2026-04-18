export interface OnboardingAnswers {
  display_name: string;
  struggles: string[];
  seeking: string[];
  familiarity: string;
  content_types: string[];
  tone: string;
  devotional_length: string;
  free_text?: string;
}

export interface SpiritualProfileData {
  bible_experience_level: string;
  main_struggles: string[];
  current_needs: string[];
  preferred_content_types: string[];
  tone_preference: string;
  devotional_length: string;
  profile_summary: string;
  caution_flags: string[];
}

export interface SpiritualProfile {
  id: string;
  user_id: string;
  bible_experience_level: string;
  main_struggles: string[];
  current_needs: string[];
  preferred_content_types: string[];
  tone_preference: string;
  devotional_length: string;
  profile_summary: string;
  caution_flags: string[];
  created_at: string;
  updated_at: string;
}

export interface ScriptureTheme {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
}

export interface DailyGuidance {
  id: string;
  user_id: string;
  theme_id: string | null;
  passage_id: string | null;
  guidance_date: string;
  title: string | null;
  context_text: string | null;
  devotional_text: string | null;
  prayer_text: string | null;
  reflection_question: string | null;
  generation_source?: string | null;
  created_at?: string;
  updated_at?: string;
  biblical_context: string;
}

export interface GuidanceFeedback {
  id: string;
  user_id: string;
  guidance_id: string;
  feedback_type: 'helpful' | 'not_relevant' | 'favorite';
  created_at: string;
}

export interface Favorite {
  id: string;
  created_at: string;
  guidance_id?: string;
  guidance?: DailyGuidance | null;
  passage?: {
    id: string;
    reference: string;
    text: string;
    translation?: string | null;
    book_name?: string;
    chapter?: number;
    verse_start?: number;
    verse_end?: number | null;
    testament?: string | null;
  } | null;
  matched_theme?: {
    id: string;
    slug: string;
    name: string;
  } | null;
}