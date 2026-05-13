-- Shepherd Database Schema
-- Run this in your Supabase SQL Editor

-- profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- onboarding_answers
CREATE TABLE IF NOT EXISTS onboarding_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  struggles TEXT[] DEFAULT '{}',
  seeking TEXT[] DEFAULT '{}',
  familiarity TEXT,
  content_types TEXT[] DEFAULT '{}',
  tone TEXT,
  devotional_length TEXT,
  free_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- spiritual_profiles
CREATE TABLE IF NOT EXISTS spiritual_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bible_experience_level TEXT,
  main_struggles TEXT[] DEFAULT '{}',
  current_needs TEXT[] DEFAULT '{}',
  preferred_content_types TEXT[] DEFAULT '{}',
  tone_preference TEXT,
  devotional_length TEXT,
  profile_summary TEXT,
  caution_flags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- scripture_themes
CREATE TABLE IF NOT EXISTS scripture_themes (
  id TEXT PRIMARY KEY,
  theme TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  verse_reference TEXT NOT NULL,
  verse_text TEXT NOT NULL,
  short_explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- daily_guidance
CREATE TABLE IF NOT EXISTS daily_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  theme TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  verse_text TEXT NOT NULL,
  devotional TEXT NOT NULL,
  prayer TEXT NOT NULL,
  reflection TEXT NOT NULL,
  theme_id TEXT REFERENCES scripture_themes(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- guidance_feedback
CREATE TABLE IF NOT EXISTS guidance_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guidance_id UUID NOT NULL REFERENCES daily_guidance(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not_relevant', 'favorite')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guidance_id, feedback_type)
);

-- guidance_favorites
CREATE TABLE IF NOT EXISTS guidance_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guidance_id UUID NOT NULL REFERENCES daily_guidance(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guidance_id)
);

-- scripture_passages (reference/seed data for AI scripture selection)
CREATE TABLE IF NOT EXISTS scripture_passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_name TEXT NOT NULL,
  book_number INTEGER,
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER,
  reference TEXT NOT NULL,
  translation TEXT NOT NULL DEFAULT 'WEB',
  text TEXT NOT NULL,
  testament TEXT,
  devotional_summary TEXT,
  caution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- scripture_theme_map (maps themes to passages with weights for AI selection)
CREATE TABLE IF NOT EXISTS scripture_theme_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID NOT NULL,
  passage_id UUID NOT NULL REFERENCES scripture_passages(id) ON DELETE CASCADE,
  weight INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE spiritual_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_guidance ENABLE ROW LEVEL SECURITY;
ALTER TABLE guidance_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE guidance_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripture_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripture_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripture_theme_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own onboarding" ON onboarding_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding" ON onboarding_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding" ON onboarding_answers FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own spiritual profile" ON spiritual_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own spiritual profile" ON spiritual_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own spiritual profile" ON spiritual_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own guidance" ON daily_guidance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own guidance" ON daily_guidance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own guidance" ON daily_guidance FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON guidance_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON guidance_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own favorites" ON guidance_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites" ON guidance_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON guidance_favorites FOR DELETE USING (auth.uid() = user_id);

-- scripture_themes is publicly readable (reference data)
CREATE POLICY "Anyone can read scripture themes" ON scripture_themes FOR SELECT USING (true);

-- scripture_passages is publicly readable (reference/seed data)
CREATE POLICY "Anyone can read scripture passages" ON scripture_passages FOR SELECT USING (true);

-- scripture_theme_map is publicly readable (reference data)
CREATE POLICY "Anyone can read scripture theme map" ON scripture_theme_map FOR SELECT USING (true);

-- Function to handle new user creation (Supabase-safe: schema-qualified + locked-down search_path)
create schema if not exists public;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_guidance_user_date ON daily_guidance(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_guidance_feedback_user ON guidance_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_guidance_favorites_user ON guidance_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_profiles_user ON spiritual_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_answers_user ON onboarding_answers(user_id);
