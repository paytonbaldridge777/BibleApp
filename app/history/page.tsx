import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import type { DailyGuidance } from '@/types';
import Footer from '@/components/layout/Footer';

export const runtime = 'edge';

type HistoryItem = DailyGuidance & {
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
};

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: history } = await supabase
    .from('daily_guidance')
    .select('*')
    .eq('user_id', user.id)
    .order('guidance_date', { ascending: false })
    .limit(60);

  const rawItems = (history ?? []) as DailyGuidance[];

  const items: HistoryItem[] = await Promise.all(
    rawItems.map(async (g) => {
      let passage: HistoryItem['passage'] = null;
      let matched_theme: HistoryItem['matched_theme'] = null;

      if (g.passage_id) {
        const { data: passageData } = await supabase
          .from('scripture_passages')
          .select('id, reference')
          .eq('id', g.passage_id)
          .maybeSingle();

        if (passageData) {
          passage = {
            id: passageData.id,
            reference: passageData.reference,
            text: (g as any).verse_text ?? '',
          };
        }
      }

      if (g.theme_id) {
        const { data: themeData } = await supabase
          .from('scripture_themes')
          .select('id, slug, name')
          .eq('id', g.theme_id)
          .maybeSingle();

        if (themeData) {
          matched_theme = themeData;
        }
      }

      return {
        ...g,
        passage,
        matched_theme,
      };
    })
  );

  return (
    <div className="min-h-screen bg-parchment-100">
      <Header userEmail={user?.email} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-serif text-ink-900">Guidance History</h1>
          <p className="text-ink-500 mt-1">
            Review your previous daily guidance entries.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-parchment-50 rounded-2xl border border-parchment-300 p-12 text-center">
            <div className="text-4xl mb-4">🗂️</div>
            <h2 className="text-lg font-semibold font-serif text-ink-900 mb-2">No previous guidance yet</h2>
            <p className="text-ink-500 text-sm mb-6">
              Once you generate daily guidance, your past entries will appear here.
            </p>
            <Link
              href="/dashboard"
              className="bg-navy-700 hover:bg-navy-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {items.map((g) => (
              <div
                key={g.id}
                className="bg-parchment-50 rounded-2xl border border-parchment-300 shadow-sm overflow-hidden"
                data-guidance-source={g.generation_source ?? 'unknown'}
                data-guidance-id={g.id}
              >
                <div className="bg-gradient-to-r from-gold-100 to-parchment-200 border-b border-gold-300 px-6 py-4">
                  <p className="text-ink-500 text-xs">{g.guidance_date}</p>
                  <div className="flex items-center justify-between gap-4 mt-1">
                    <span className="bg-gold-200 text-navy-800 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                      {g.title || 'Guidance'}
                    </span>
                    <p className="text-navy-700 font-semibold font-serif text-sm italic">
                      {g.passage?.reference || ''}
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <blockquote className="border-l-4 border-gold-400 pl-5 py-1">
                    <p className="font-serif italic text-ink-800 leading-relaxed">
                      &ldquo;{g.passage?.text || 'Verse unavailable'}&rdquo;
                    </p>
                  </blockquote>

                  {g.context_text && (
                    <div>
                      <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-1">
                        Biblical Context
                      </p>
                      <p className="text-ink-700 text-sm leading-relaxed">
                        {g.context_text}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-1">
                      Devotional
                    </p>
                    <p className="text-ink-700 text-sm leading-relaxed">
                      {g.devotional_text}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-1">
                      Prayer
                    </p>
                    <p className="text-ink-700 text-sm leading-relaxed font-serif italic">
                      {g.prayer_text}
                    </p>
                  </div>

                  <div className="bg-parchment-100 rounded-lg p-3 border border-parchment-300">
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-1">
                      Reflection
                    </p>
                    <p className="text-ink-700 text-sm">
                      {g.reflection_question}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
          <Footer />
    </div>
  );
}