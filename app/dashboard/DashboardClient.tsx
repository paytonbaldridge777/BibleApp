'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/db/supabase';
import { getGuidance, postGuidance, postFeedback } from '@/lib/api';
import type { DailyGuidance, GuidancePassage, GuidanceTheme } from '@/lib/api';
import type { SpiritualProfile } from '@/types';

interface Props {
  user: { id: string; email: string };
  profile: SpiritualProfile;
  todayGuidance: (DailyGuidance & {
    passage?: GuidancePassage | null;
    matched_theme?: GuidanceTheme | null;
  }) | null;
  recentGuidance: Array<
    DailyGuidance & {
      passage?: GuidancePassage | null;
      matched_theme?: GuidanceTheme | null;
    }
  >;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function calculateStreak(guidanceList: DailyGuidance[]): number {
  if (!guidanceList.length) return 0;

  const sorted = [...guidanceList].sort((a, b) =>
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

type GuidanceViewModel = DailyGuidance & {
  passage?: GuidancePassage | null;
  matched_theme?: GuidanceTheme | null;
};

function toGuidanceViewModel(json: {
  guidance: DailyGuidance | null;
  passage: GuidancePassage | null;
  matched_theme: GuidanceTheme | null;
}): GuidanceViewModel | null {
  if (!json.guidance) return null;

  return {
    ...json.guidance,
    passage: json.passage,
    matched_theme: json.matched_theme,
  };
}

export default function DashboardClient({
  user,
  profile,
  todayGuidance,
  recentGuidance,
}: Props) {
  const router = useRouter();
  const [guidance, setGuidance] = useState<GuidanceViewModel | null>(todayGuidance);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    const loadGuidance = async () => {
      try {
        const json = await getGuidance();
        const mapped = toGuidanceViewModel(json);
        if (!mapped) return;
        setGuidance(mapped);
      } catch (err) {
        console.error('Failed to load guidance', err);
      }
    };

    loadGuidance();
  }, []);

  const streak = calculateStreak(recentGuidance);

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const generateGuidance = async (action: 'generate' | 'regenerate') => {
    setIsGenerating(true);
    setError('');

    try {
      const json = await postGuidance(action);
      setGuidance(toGuidanceViewModel(json));
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

  const today = new Date().toISOString().split('T')[0];

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-semibold text-amber-700">
              Shepherd
            </Link>
            <nav className="flex items-center gap-4 text-sm text-stone-600">
              <Link href="/favorites" className="hover:text-stone-900">
                Favorites
              </Link>
              <Link href="/settings" className="hover:text-stone-900">
                Settings
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-stone-600">{user.email}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-stone-700 hover:bg-stone-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto max-w-6xl px-6 py-3 text-sm text-amber-900">
          Shepherd provides spiritual encouragement only. For mental health support,
          please consult a professional. In crisis? Call or text 988.
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[1fr_320px]">
        <section className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {getGreeting()}
                {user.email ? ` — ${user.email.split('@')[0]}` : ''}
              </h1>
              <p className="mt-1 text-stone-600">{formatDate(today)}</p>
            </div>

            {streak > 0 && (
              <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
                {streak} day{streak !== 1 ? 's' : ''} streak
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {guidance ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-sm font-medium uppercase tracking-wide text-amber-700">
                  Today&apos;s Guidance
                </p>
                <p className="mt-1 text-sm text-stone-500">{formatDate(today)}</p>
                <h2 className="mt-3 text-2xl font-semibold text-stone-900">
                  {guidance.title || 'Today’s Guidance'}
                </h2>
                {guidance.matched_theme?.name && (
                  <p className="mt-2 text-sm text-stone-600">
                    Theme: {guidance.matched_theme.name}
                  </p>
                )}
              </div>

              <div className="space-y-6">
                <section>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
                    Today&apos;s Verse
                  </h3>
                  {guidance.passage?.text ? (
                    <>
                      <p className="text-lg leading-8 text-stone-800">
                        “{guidance.passage.text}”
                      </p>
                      <p className="mt-3 text-sm font-medium text-stone-600">
                        {guidance.passage.reference}
                      </p>
                    </>
                  ) : (
                    <p className="text-stone-500">Verse details not yet loaded...</p>
                  )}
                </section>

                {guidance.context_text && (
                  <section>
                    <h3 className="mb-2 text-base font-semibold text-stone-900">
                      Biblical Context
                    </h3>
                    <p className="whitespace-pre-line leading-7 text-stone-700">
                      {guidance.context_text}
                    </p>
                  </section>
                )}

                <section>
                  <h3 className="mb-2 text-base font-semibold text-stone-900">
                    Devotional
                  </h3>
                  <p className="whitespace-pre-line leading-7 text-stone-700">
                    {guidance.devotional_text}
                  </p>
                </section>

                <section>
                  <h3 className="mb-2 text-base font-semibold text-stone-900">
                    Prayer
                  </h3>
                  <p className="whitespace-pre-line leading-7 text-stone-700">
                    {guidance.prayer_text}
                  </p>
                </section>

                <section>
                  <h3 className="mb-2 text-base font-semibold text-stone-900">
                    Reflection
                  </h3>
                  <p className="leading-7 text-stone-700">
                    {guidance.reflection_question}
                  </p>
                </section>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => sendFeedback(true)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      feedbackState['helpful'] === 'sent'
                        ? 'border-green-300 bg-green-100 text-green-700'
                        : 'border-stone-300 text-stone-600 hover:border-green-300 hover:text-green-700'
                    }`}
                  >
                    {feedbackState['helpful'] === 'sent' ? 'Marked Helpful' : 'Helpful'}
                  </button>

                  <button
                    onClick={() => sendFeedback(false)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      feedbackState['not_helpful'] === 'sent'
                        ? 'border-red-300 bg-red-100 text-red-700'
                        : 'border-stone-300 text-stone-600 hover:border-red-300 hover:text-red-700'
                    }`}
                  >
                    {feedbackState['not_helpful'] === 'sent'
                      ? 'Marked Not Helpful'
                      : 'Not Helpful'}
                  </button>

                  <button
                    onClick={() => generateGuidance('regenerate')}
                    disabled={isGenerating}
                    className="ml-auto rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:border-stone-400 disabled:opacity-50"
                  >
                    ✨ {isGenerating ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-semibold text-stone-900">
                Ready for today&apos;s guidance?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-stone-600">
                Shepherd will select a verse and create a personalized devotional,
                prayer, reflection, and biblical context just for you.
              </p>
              <button
                onClick={() => generateGuidance('generate')}
                disabled={isGenerating}
                className="mt-6 rounded-xl bg-amber-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-amber-700 disabled:bg-amber-400"
              >
                {isGenerating ? 'Generating your guidance...' : "Generate Today's Guidance"}
              </button>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-900">Your Profile</h3>
              <Link href="/settings" className="text-sm text-amber-700 hover:text-amber-800">
                Edit
              </Link>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-stone-500">Experience</p>
                <p className="mt-1 font-medium text-stone-800">
                  {profile.bible_experience_level}
                </p>
              </div>

              {profile.current_needs?.length > 0 && (
                <div>
                  <p className="text-stone-500">Seeking</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.current_needs.slice(0, 3).map((need) => (
                      <span
                        key={need}
                        className="rounded-full bg-stone-100 px-3 py-1 text-stone-700"
                      >
                        {need.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-stone-500">Tone</p>
                <p className="mt-1 font-medium capitalize text-stone-800">
                  {profile.tone_preference}
                </p>
              </div>

              {profile.profile_summary && (
                <p className="rounded-xl bg-stone-50 p-3 leading-6 text-stone-700">
                  {profile.profile_summary}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-stone-900">Quick Links</h3>
            <div className="flex flex-col gap-3 text-sm">
              <Link href="/favorites" className="text-stone-700 hover:text-stone-900">
                ⭐ Saved Favorites
              </Link>
              <Link href="/settings" className="text-stone-700 hover:text-stone-900">
                ⚙️ Update Profile
              </Link>
            </div>
          </div>

          {recentGuidance.length > 1 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-stone-900">
                Recent Guidance
              </h3>
              <div className="space-y-3">
                {recentGuidance.slice(1, 7).map((g) => (
                  <div key={g.id} className="rounded-xl bg-stone-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-stone-500">
                      {g.guidance_date}
                    </p>
                    <p className="mt-1 font-medium text-stone-800">
                      {g.title || 'Guidance'}
                    </p>
                    {g.passage?.reference && (
                      <p className="mt-1 text-sm text-stone-600">{g.passage.reference}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
