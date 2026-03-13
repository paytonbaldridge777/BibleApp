'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/db/supabase';
import { postGuidance, postFeedback } from '@/lib/api';
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
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function calculateStreak(guidanceList: DailyGuidance[]): number {
  if (!guidanceList.length) return 0;
  const sorted = [...guidanceList].sort((a, b) =>
    (b.guidance_date > a.guidance_date ? 1 : -1)
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
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

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
  setGuidance({
  ...json.guidance,
  verse_reference: json.passage?.reference,
  verse_text: json.passage?.text,
  theme: json.matched_theme?.name,
  });
  } catch (err) {
  setError(err instanceof Error ? err.message : 'Something went wrong');
  } finally {
  setIsGenerating(false);
  }
  };

  const sendFeedback = async (type: 'helpful' | 'not_relevant' | 'favorite') => {
    if (!guidance) return;
    try {
      await postFeedback(guidance.id, type);
      setFeedbackState((prev) => ({ ...prev, [type]: 'sent' }));
    } catch {
      // silently fail feedback
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl">🌿</span>
              <span className="text-lg font-bold text-amber-700">Shepherd</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-4">
              <Link href="/dashboard" className="text-sm font-medium text-stone-700 hover:text-stone-900">
                Dashboard
              </Link>
              <Link href="/favorites" className="text-sm text-stone-500 hover:text-stone-700">
                Favorites
              </Link>
              <Link href="/settings/profile" className="text-sm text-stone-500 hover:text-stone-700">
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-500 hidden sm:block">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-stone-600 hover:text-stone-900 border border-stone-300 hover:border-stone-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 text-center">
        <p className="text-xs text-amber-800">
          Shepherd provides spiritual encouragement only. For mental health support, please consult
          a professional.{' '}
          <strong>In crisis? Call or text 988.</strong>
        </p>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome + streak */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              {getGreeting()} {user.email ? ` — ${user.email.split('@')[0]}` : ''}
            </h1>
            <p className="text-stone-500 mt-0.5">{formatDate(today)}</p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold">
              <span>🔥</span> {streak} day{streak !== 1 ? 's' : ''} streak
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Today's Guidance Card */}
            {guidance ? (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-orange-500 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-xs font-medium uppercase tracking-wide">
                        Today&apos;s Guidance
                      </p>
                      <p className="text-white text-sm mt-0.5">{formatDate(today)}</p>
                    </div>
                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-medium capitalize">
                      {guidance.title || 'Today’s Guidance'}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Verse */}
                  <div className="bg-amber-50 rounded-xl p-5 border border-amber-100"> 
                    <p className="text-amber-700 text-xs font-semibold uppercase tracking-wide mb-2"> Today&apos;s Verse </p> 
                    {guidance.verse_text ? ( <> <p className="text-stone-700 italic leading-relaxed mb-3"> “{guidance.verse_text}” </p> 
                      <p className="text-stone-500 text-sm font-medium"> {guidance.verse_reference} </p> </> ) : ( <p className="text-stone-500 text-sm">Verse details not yet loaded.</p> )} 
                  </div>

                  {/* Devotional */}
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-2 flex items-center gap-2">
                      <span>📖</span> Devotional
                    </h3>
                    <p className="text-stone-700 leading-relaxed text-sm">{guidance.devotional_text}</p>
                  </div>

                  {/* Prayer */}
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-2 flex items-center gap-2">
                      <span>🙏</span> Prayer
                    </h3>
                    <p className="text-stone-700 leading-relaxed text-sm italic">{guidance.prayer_text}</p>
                  </div>

                  {/* Reflection */}
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    <h3 className="font-semibold text-stone-900 mb-2 flex items-center gap-2">
                      <span>💭</span> Reflection
                    </h3>
                    <p className="text-stone-700 text-sm">{guidance.reflection_question}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => sendFeedback('helpful')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        feedbackState['helpful'] === 'sent'
                          ? 'bg-green-100 border-green-300 text-green-700'
                          : 'border-stone-300 text-stone-600 hover:border-green-300 hover:text-green-700'
                      }`}
                    >
                      <span>👍</span> {feedbackState['helpful'] === 'sent' ? 'Marked Helpful' : 'Helpful'}
                    </button>
                    <button
                      onClick={() => sendFeedback('favorite')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        feedbackState['favorite'] === 'sent'
                          ? 'bg-amber-100 border-amber-300 text-amber-700'
                          : 'border-stone-300 text-stone-600 hover:border-amber-300 hover:text-amber-700'
                      }`}
                    >
                      <span>⭐</span> {feedbackState['favorite'] === 'sent' ? 'Saved!' : 'Save as Favorite'}
                    </button>
                    <button
                      onClick={() => sendFeedback('not_relevant')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        feedbackState['not_relevant'] === 'sent'
                          ? 'bg-stone-100 border-stone-300 text-stone-500'
                          : 'border-stone-300 text-stone-500 hover:border-stone-400'
                      }`}
                    >
                      <span>🔄</span> {feedbackState['not_relevant'] === 'sent' ? 'Noted' : 'Not Relevant'}
                    </button>
                    <button
                      onClick={() => generateGuidance('regenerate')}
                      disabled={isGenerating}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-stone-300 text-stone-600 hover:border-stone-400 transition-colors disabled:opacity-50"
                    >
                      <span>✨</span> {isGenerating ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-10 text-center">
                <div className="text-5xl mb-4">🌅</div>
                <h2 className="text-xl font-bold text-stone-900 mb-2">
                  Ready for today&apos;s guidance?
                </h2>
                <p className="text-stone-600 mb-6 text-sm">
                  Shepherd will select a verse and create a personalized devotional, prayer, and
                  reflection just for you.
                </p>
                <button
                  onClick={() => generateGuidance('generate')}
                  disabled={isGenerating}
                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
                >
                  {isGenerating ? 'Generating your guidance...' : "Generate Today's Guidance"}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Profile Summary */}
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h3 className="font-semibold text-stone-900 mb-3 flex items-center justify-between">
                Your Profile
                <Link
                  href="/settings/profile"
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  Edit
                </Link>
              </h3>
              <div className="space-y-2.5">
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">Experience</p>
                  <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                    {profile.bible_experience_level}
                  </span>
                </div>
                {profile.current_needs?.length > 0 && (
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">Seeking</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.current_needs.slice(0, 3).map((need) => (
                        <span
                          key={need}
                          className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full text-xs capitalize"
                        >
                          {need.replace(/-/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">Tone</p>
                  <span className="text-stone-700 text-xs capitalize">{profile.tone_preference}</span>
                </div>
              </div>
              {profile.profile_summary && (
                <p className="text-xs text-stone-500 mt-3 leading-relaxed border-t border-stone-100 pt-3">
                  {profile.profile_summary}
                </p>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h3 className="font-semibold text-stone-900 mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/favorites"
                  className="flex items-center gap-2 text-sm text-stone-600 hover:text-amber-700 transition-colors"
                >
                  <span>⭐</span> Saved Favorites
                </Link>
                <Link
                  href="/settings/profile"
                  className="flex items-center gap-2 text-sm text-stone-600 hover:text-amber-700 transition-colors"
                >
                  <span>⚙️</span> Update Profile
                </Link>
              </div>
            </div>

            {/* Recent History */}
            {recentGuidance.length > 1 && (
              <div className="bg-white rounded-xl border border-stone-200 p-5">
                <h3 className="font-semibold text-stone-900 mb-3">Recent Guidance</h3>
                <div className="space-y-2">
                  {recentGuidance.slice(1, 7).map((g) => (
                    <div key={g.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-stone-500">{g.date}</p>
                        <p className="text-sm text-stone-700 capitalize">{g.theme}</p>
                      </div>
                      <span className="text-xs text-stone-400">{g.verse_reference}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
