'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/db/supabase';
import {
  postGuidance,
  postFeedback,
  saveFavorite,
} from '@/lib/api';
import type { DailyGuidance, SpiritualProfile } from '@/types';

interface Props {
  user: { id: string; email: string };
  profile: SpiritualProfile;
  todayGuidance: DailyGuidance | null;
  recentGuidance: DailyGuidance[];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function calculateStreak(guidanceList: DailyGuidance[], todayGuidance: DailyGuidance | null): number {
  const combined = todayGuidance ? [todayGuidance, ...guidanceList] : [...guidanceList];
  if (!combined.length) return 0;

  const sorted = [...combined].sort((a, b) =>
    b.guidance_date > a.guidance_date ? 1 : -1
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0];

    if (sorted[i].guidance_date === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export default function DashboardClient({
  user,
  profile,
  todayGuidance,
  recentGuidance,
}: Props) {
  const router = useRouter();
  const [guidance, setGuidance] = useState<DailyGuidance | null>(todayGuidance);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackState, setFeedbackState] = useState<Record<string, 'sent'>>({});
  const [error, setError] = useState('');
  const [favoriteSaved, setFavoriteSaved] = useState(false);

  const streak = calculateStreak(recentGuidance, guidance);
  const today = new Date().toISOString().split('T')[0];

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const generateGuidance = async (action: 'generate' | 'regenerate') => {
    setIsGenerating(true);
    setError('');

    try {
      const json = await postGuidance(action);
      setGuidance({
        ...json.guidance,
        verse_reference: json.passage?.reference,
        verse_text: json.passage?.text,
        theme: json.matched_theme?.name,
      });
      setFavoriteSaved(false);
      setFeedbackState({});
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendFeedback = async (helpful: boolean) => {
    if (!guidance) return;

    try {
      await postFeedback({
        guidance_id: guidance.id,
        helpful,
      });

      setFeedbackState((prev) => ({
        ...prev,
        [helpful ? 'helpful' : 'not_helpful']: 'sent',
      }));
    } catch {
      // silently fail feedback
    }
  };

  const handleSaveFavorite = async () => {
    if (!guidance) return;

    try {
      await saveFavorite(guidance.id);
      setFavoriteSaved(true);
    } catch {
      // silently fail favorite save
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-stone-800">Shepherd Dashboard</h1>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <Link href="/favorites" className="text-stone-600 hover:text-stone-900">
                Favorites
              </Link>
              <Link href="/history" className="text-stone-600 hover:text-stone-900">
                History
              </Link>
              <Link href="/settings/profile" className="text-stone-600 hover:text-stone-900">
                Settings
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-600">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-stone-600 hover:text-stone-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Shepherd provides spiritual encouragement only. For mental health support, please consult a professional. In crisis? Call or text 988.
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-stone-800">
              {getGreeting()}
              {user.email ? ` — ${user.email.split('@')[0]}` : ''}
            </h2>
            <p className="text-stone-600 mt-1">{formatDate(today)}</p>
            {streak > 0 && (
              <div className="mt-3 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800">
                {streak} day{streak !== 1 ? 's' : ''} streak
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {guidance ? (
            <div
              className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden"
              data-guidance-source={guidance.generation_source ?? 'unknown'}
              data-guidance-id={guidance.id}
            >
              <div className="bg-amber-600 px-6 py-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-amber-100 text-sm">Today&apos;s Guidance</p>
                    <h3 className="text-2xl font-semibold mt-1">{formatDate(guidance.guidance_date)}</h3>
                  </div>
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-medium capitalize">
                    {guidance.title || 'Today’s Guidance'}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                  <p className="text-amber-700 text-xs font-semibold uppercase tracking-wide mb-2">
                    Today&apos;s Verse
                  </p>
                  {guidance.verse_text ? (
                    <>
                      <p className="text-stone-700 italic leading-relaxed mb-3">
                        “{guidance.verse_text}”
                      </p>
                      <p className="text-stone-500 text-sm font-medium">
                        {guidance.verse_reference}
                      </p>
                    </>
                  ) : (
                    <p className="text-stone-500 text-sm">Verse details not yet loaded.</p>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-stone-800 mb-2">Devotional</h4>
                  <p className="text-stone-700 leading-relaxed text-sm">
                    {guidance.devotional_text}
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-stone-800 mb-2">Prayer</h4>
                  <p className="text-stone-700 leading-relaxed text-sm italic">
                    {guidance.prayer_text}
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-stone-800 mb-2">Reflection</h4>
                  <p className="text-stone-700 text-sm">
                    {guidance.reflection_question}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => sendFeedback(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      feedbackState['helpful'] === 'sent'
                        ? 'bg-green-100 border-green-300 text-green-700'
                        : 'border-stone-300 text-stone-600 hover:border-green-300 hover:text-green-700'
                    }`}
                  >
                    👍 {feedbackState['helpful'] === 'sent' ? 'Marked Helpful' : 'Helpful'}
                  </button>

                  <button
                    onClick={() => sendFeedback(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      feedbackState['not_helpful'] === 'sent'
                        ? 'bg-red-100 border-red-300 text-red-700'
                        : 'border-stone-300 text-stone-600 hover:border-red-300 hover:text-red-700'
                    }`}
                  >
                    👎 {feedbackState['not_helpful'] === 'sent' ? 'Marked Not Helpful' : 'Not Helpful'}
                  </button>

                  <button
                    onClick={handleSaveFavorite}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      favoriteSaved
                        ? 'bg-amber-100 border-amber-300 text-amber-700'
                        : 'border-stone-300 text-stone-600 hover:border-amber-300 hover:text-amber-700'
                    }`}
                  >
                    ⭐ {favoriteSaved ? 'Saved to Favorites' : 'Save as Favorite'}
                  </button>

                  <button
                    onClick={() => generateGuidance('regenerate')}
                    disabled={isGenerating}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-stone-300 text-stone-600 hover:border-stone-400 transition-colors disabled:opacity-50"
                  >
                    ✨ {isGenerating ? 'Regenerating...' : 'Regenerate Today'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-8 text-center">
              <h3 className="text-2xl font-semibold text-stone-800 mb-3">
                Ready for today&apos;s guidance?
              </h3>
              <p className="text-stone-600 mb-6">
                You have not generated guidance for today yet. Create today&apos;s verse, devotional, prayer, and reflection here.
              </p>
              <button
                onClick={() => generateGuidance('generate')}
                disabled={isGenerating}
                className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
              >
                {isGenerating ? 'Generating today\'s guidance...' : "Generate Today's Guidance"}
              </button>
              {recentGuidance.length > 0 && (
                <p className="text-sm text-stone-500 mt-4">
                  Looking for an older entry? Visit{' '}
                  <Link href="/history" className="text-amber-700 hover:text-amber-800 font-medium">
                    Guidance History
                  </Link>
                  .
                </p>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-800">Your Profile</h3>
              <Link href="/settings/profile" className="text-sm text-amber-700 hover:text-amber-800">
                Edit
              </Link>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-stone-500 mb-1">Experience</p>
                <p className="text-stone-800">{profile.bible_experience_level}</p>
              </div>

              {profile.current_needs?.length > 0 && (
                <div>
                  <p className="text-stone-500 mb-2">Seeking</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.current_needs.slice(0, 3).map((need) => (
                      <span
                        key={need}
                        className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700 text-xs"
                      >
                        {need.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-stone-500 mb-1">Tone</p>
                <p className="text-stone-800">{profile.tone_preference}</p>
              </div>

              {profile.profile_summary && (
                <div className="rounded-lg bg-stone-50 p-3 text-stone-600">
                  {profile.profile_summary}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5">
            <h3 className="text-lg font-semibold text-stone-800 mb-4">Quick Links</h3>
            <div className="space-y-3 text-sm">
              <Link href="/favorites" className="block text-stone-700 hover:text-stone-900">
                ⭐ Saved Favorites
              </Link>
              <Link href="/history" className="block text-stone-700 hover:text-stone-900">
                🗂️ Guidance History
              </Link>
              <Link href="/settings/profile" className="block text-stone-700 hover:text-stone-900">
                ⚙️ Update Profile
              </Link>
            </div>
          </div>

          {recentGuidance.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h3 className="text-lg font-semibold text-stone-800">Previous Guidance</h3>
                <Link href="/history" className="text-sm text-amber-700 hover:text-amber-800">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentGuidance.slice(0, 6).map((g) => (
                  <div key={g.id} className="rounded-lg border border-stone-100 bg-stone-50 p-3">
                    <p className="text-xs text-stone-500">{g.guidance_date}</p>
                    <p className="text-sm text-stone-700 capitalize">{g.title || 'Guidance'}</p>
                    <span className="text-xs text-stone-400">{g.verse_reference || ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
