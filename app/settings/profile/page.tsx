import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { SpiritualProfile } from '@/types';

export default async function ProfileSettingsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('spiritual_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const sp = profile as SpiritualProfile | null;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl">🌿</span>
              <span className="text-lg font-bold text-amber-700">Shepherd</span>
            </Link>
            <nav className="hidden sm:flex gap-4">
              <Link href="/dashboard" className="text-sm text-stone-500 hover:text-stone-700">Dashboard</Link>
              <Link href="/favorites" className="text-sm text-stone-500 hover:text-stone-700">Favorites</Link>
              <Link href="/settings/profile" className="text-sm font-medium text-stone-800">Settings</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-stone-500 hover:text-stone-700 text-sm flex items-center gap-1"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-stone-900 mb-6">Your Spiritual Profile</h1>

        {sp ? (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5">
            {sp.profile_summary && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-stone-700 text-sm leading-relaxed italic">{sp.profile_summary}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">
                  Bible Experience
                </p>
                <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg text-sm font-medium capitalize">
                  {sp.bible_experience_level}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">
                  Preferred Tone
                </p>
                <span className="text-stone-800 text-sm capitalize">{sp.tone_preference}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">
                  Devotional Length
                </p>
                <span className="text-stone-800 text-sm capitalize">
                  {sp.devotional_length?.replace(/-/g, ' ')}
                </span>
              </div>
            </div>

            {sp.current_needs?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  Currently Seeking
                </p>
                <div className="flex flex-wrap gap-2">
                  {sp.current_needs.map((need) => (
                    <span
                      key={need}
                      className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full text-xs capitalize"
                    >
                      {need.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {sp.main_struggles?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  Bible Reading Challenges
                </p>
                <div className="flex flex-wrap gap-2">
                  {sp.main_struggles.map((s) => (
                    <span
                      key={s}
                      className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full text-xs capitalize"
                    >
                      {s.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-stone-100 pt-5">
              <p className="text-sm text-stone-600 mb-4">
                Want to update your preferences? You can redo the onboarding questionnaire at any
                time.
              </p>
              <Link
                href="/onboarding"
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-block text-sm"
              >
                Redo Onboarding
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            <p className="text-stone-600 mb-4">No profile found. Complete onboarding to get started.</p>
            <Link
              href="/onboarding"
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-block"
            >
              Start Onboarding
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
