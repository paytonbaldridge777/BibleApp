export interface OnboardingAnswers {
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
  theme: string;
  tags: string[];
  verse_reference: string;
  verse_text: string;
  short_explanation: string;
}

export interface DailyGuidance {
id: string;
user_id: string;
guidance_date: string;
title: string;
devotional_text: string;
prayer_text: string;
reflection_question: string;
theme_id?: string;
passage_id?: string;
created_at: string;
updated_at?: string;
date?: string;
theme?: string;
verse_reference?: string;
verse_text?: string;
devotional?: string;
prayer?: string;
reflection?: string;
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
  user_id: string;
  guidance_id: string;
  created_at: string;
  daily_guidance?: DailyGuidance;
}
