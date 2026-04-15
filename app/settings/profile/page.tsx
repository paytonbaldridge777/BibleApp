import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import type { SpiritualProfile } from '@/types';
import ChangePasswordForm from '../ChangePasswordForm';
export const runtime = 'edge';

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
    <div className="min-h-screen bg-parchment-100">
      <Header userEmail={user?.email} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-ink-500 hover:text-ink-700 text-sm flex items-center gap-1"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold font-serif text-ink-900 mb-6">Your Spiritual Profile</h1>

        {sp ? (
          <div className="bg-parchment-50 rounded-2xl border border-parchment-300 shadow-sm p-6 space-y-5">
            {sp.profile_summary && (
              <div className="bg-gold-100 rounded-xl p-4 border border-gold-300">
                <p className="text-ink-700 text-sm leading-relaxed font-serif italic">{sp.profile_summary}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-1">
                  Bible Experience
                </p>
                <span className="bg-gold-200 text-navy-800 px-2.5 py-1 rounded-lg text-sm font-medium capitalize">
                  {sp.bible_experience_level}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-1">
                  Preferred Tone
                </p>
                <span className="text-ink-800 text-sm capitalize">{sp.tone_preference}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-1">
                  Devotional Length
                </p>
                <span className="text-ink-800 text-sm capitalize">
                  {sp.devotional_length?.replace(/-/g, ' ')}
                </span>
              </div>
            </div>

            {sp.current_needs?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-2">
                  Currently Seeking
                </p>
                <div className="flex flex-wrap gap-2">
                  {sp.current_needs.map((need) => (
                    <span
                      key={need}
                      className="bg-parchment-200 text-ink-700 px-2.5 py-1 rounded-full text-xs capitalize"
                    >
                      {need.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {sp.main_struggles?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-2">
                  Bible Reading Challenges
                </p>
                <div className="flex flex-wrap gap-2">
                  {sp.main_struggles.map((s) => (
                    <span
                      key={s}
                      className="bg-parchment-200 text-ink-700 px-2.5 py-1 rounded-full text-xs capitalize"
                    >
                      {s.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-parchment-300 pt-5">
              <p className="text-sm text-ink-600 mb-4">
                Want to update your preferences? You can redo the onboarding questionnaire at any
                time.
              </p>
              <Link
                href="/onboarding"
                className="bg-navy-700 hover:bg-navy-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-block text-sm"
              >
                Redo Onboarding
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-parchment-50 rounded-2xl border border-parchment-300 p-8 text-center">
            <p className="text-ink-600 mb-4">No profile found. Complete onboarding to get started.</p>
            <Link
              href="/onboarding"
              className="bg-navy-700 hover:bg-navy-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-block"
            >
              Start Onboarding
            </Link>
          </div>
        )}
        <div className="mt-6">
          <ChangePasswordForm />
        </div>
      </main>
    </div>
  );
}